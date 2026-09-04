//! LAN play. The native app serves the very same web bundle over HTTP to every
//! other device on the wireless network, and relays a WebSocket between them.
//!
//! Deliberately dumb: the game rules live in TypeScript and run in the host's
//! webview, so there is exactly one implementation of them. Rust serves assets,
//! accepts sockets, and forwards frames in both directions.

use std::{
    collections::HashMap,
    net::{Ipv4Addr, SocketAddr},
    sync::{
        atomic::{AtomicU64, Ordering},
        Arc, Mutex,
    },
};

use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    http::{header, StatusCode, Uri},
    response::{IntoResponse, Response},
    routing::get,
    Router,
};
use futures_util::{SinkExt, StreamExt};
use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, Runtime};
use tokio::sync::mpsc;

/// Ports tried in order; the first free one wins.
const PORTS: [u16; 8] = [8077, 8078, 8079, 8080, 8081, 8082, 8083, 8084];

#[derive(Clone, Serialize)]
pub struct LanInfo {
    pub ip: String,
    pub port: u16,
    pub url: String,
    /// Inline SVG of `url`, so a phone can join by pointing its camera at it.
    pub qr: String,
}

#[derive(Clone, Serialize)]
struct Incoming {
    conn: u64,
    payload: String,
}

type Conns = Arc<Mutex<HashMap<u64, mpsc::UnboundedSender<String>>>>;

struct Server {
    info: LanInfo,
    shutdown: tokio::sync::oneshot::Sender<()>,
}

#[derive(Default)]
pub struct Lan {
    server: Mutex<Option<Server>>,
    conns: Conns,
    next_id: AtomicU64,
}

struct Ctx<R: Runtime> {
    app: AppHandle<R>,
    conns: Conns,
    next_id: Arc<AtomicU64>,
}

// derived Clone would demand `R: Clone`, which Runtime does not require
impl<R: Runtime> Clone for Ctx<R> {
    fn clone(&self) -> Self {
        Self {
            app: self.app.clone(),
            conns: self.conns.clone(),
            next_id: self.next_id.clone(),
        }
    }
}

/// Serve the bundled frontend — byte for byte what the desktop window runs.
async fn assets<R: Runtime>(uri: Uri, State(ctx): State<Ctx<R>>) -> Response {
    let path = match uri.path() {
        "/" | "" => "/index.html".to_string(),
        p => p.to_string(),
    };
    let resolver = ctx.app.asset_resolver();
    let asset = resolver
        .get(path.clone())
        // unknown paths fall back to the shell, so a deep link still loads
        .or_else(|| resolver.get("/index.html".to_string()));

    match asset {
        Some(a) => (
            StatusCode::OK,
            [
                (header::CONTENT_TYPE, a.mime_type),
                (header::CACHE_CONTROL, "no-cache".to_string()),
            ],
            a.bytes,
        )
            .into_response(),
        None => (StatusCode::NOT_FOUND, "not found").into_response(),
    }
}

async fn ws_upgrade<R: Runtime>(ws: WebSocketUpgrade, State(ctx): State<Ctx<R>>) -> Response {
    ws.on_upgrade(move |socket| serve_socket(socket, ctx))
}

async fn serve_socket<R: Runtime>(socket: WebSocket, ctx: Ctx<R>) {
    let id = ctx.next_id.fetch_add(1, Ordering::SeqCst);
    let (mut sink, mut stream) = socket.split();
    let (out_tx, mut out_rx) = mpsc::unbounded_channel::<String>();

    ctx.conns.lock().unwrap().insert(id, out_tx);
    let _ = ctx.app.emit("lan://open", id);

    let pump = tokio::spawn(async move {
        while let Some(text) = out_rx.recv().await {
            if sink.send(Message::Text(text.into())).await.is_err() {
                break;
            }
        }
    });

    while let Some(Ok(msg)) = stream.next().await {
        if let Message::Text(text) = msg {
            let _ = ctx.app.emit(
                "lan://message",
                Incoming {
                    conn: id,
                    payload: text.to_string(),
                },
            );
        }
    }

    pump.abort();
    ctx.conns.lock().unwrap().remove(&id);
    let _ = ctx.app.emit("lan://close", id);
}

fn local_ip() -> String {
    local_ip_address::local_ip()
        .map(|ip| ip.to_string())
        .unwrap_or_else(|_| "127.0.0.1".to_string())
}

fn qr_svg(url: &str) -> String {
    use qrcode::{render::svg, EcLevel, QrCode};
    match QrCode::with_error_correction_level(url.as_bytes(), EcLevel::M) {
        Ok(code) => code
            .render()
            .min_dimensions(240, 240)
            .dark_color(svg::Color("#0a0a16"))
            .light_color(svg::Color("#ffffff"))
            .build(),
        Err(_) => String::new(),
    }
}

#[tauri::command]
pub async fn lan_start<R: Runtime>(app: AppHandle<R>) -> Result<LanInfo, String> {
    {
        let state = app.state::<Lan>();
        let guard = state.server.lock().unwrap();
        if let Some(server) = guard.as_ref() {
            return Ok(server.info.clone()); // already hosting
        }
    }

    let ctx = {
        let state = app.state::<Lan>();
        Ctx {
            app: app.clone(),
            conns: state.conns.clone(),
            next_id: Arc::new(AtomicU64::new(state.next_id.load(Ordering::SeqCst))),
        }
    };

    let router = Router::new()
        // A page served by an ordinary web server must be able to tell that it
        // is NOT talking to a host, without a failed WebSocket handshake
        // spraying errors into the console.
        .route(
            "/lan/hello",
            get(|| async { axum::Json(serde_json::json!({ "bingo": "host" })) }),
        )
        .route("/ws", get(ws_upgrade::<R>))
        .fallback(assets::<R>)
        .with_state(ctx);

    let mut bound = None;
    for port in PORTS {
        let addr = SocketAddr::from((Ipv4Addr::UNSPECIFIED, port));
        if let Ok(listener) = tokio::net::TcpListener::bind(addr).await {
            bound = Some((listener, port));
            break;
        }
    }
    let (listener, port) = bound.ok_or_else(|| "no free port between 8077 and 8084".to_string())?;

    let ip = local_ip();
    let url = format!("http://{ip}:{port}/");
    let info = LanInfo {
        ip,
        port,
        qr: qr_svg(&url),
        url,
    };

    let (tx, rx) = tokio::sync::oneshot::channel::<()>();
    tauri::async_runtime::spawn(async move {
        let _ = axum::serve(listener, router)
            .with_graceful_shutdown(async {
                let _ = rx.await;
            })
            .await;
    });

    let state = app.state::<Lan>();
    *state.server.lock().unwrap() = Some(Server {
        info: info.clone(),
        shutdown: tx,
    });
    Ok(info)
}

#[tauri::command]
pub fn lan_stop<R: Runtime>(app: AppHandle<R>) {
    let state = app.state::<Lan>();
    if let Some(server) = state.server.lock().unwrap().take() {
        let _ = server.shutdown.send(());
    }
    state.conns.lock().unwrap().clear();
}

#[tauri::command]
pub fn lan_status<R: Runtime>(app: AppHandle<R>) -> Option<LanInfo> {
    app.state::<Lan>()
        .server
        .lock()
        .unwrap()
        .as_ref()
        .map(|s| s.info.clone())
}

/// Send to one connection, or to all of them when `conn` is omitted.
#[tauri::command]
pub fn lan_send<R: Runtime>(app: AppHandle<R>, conn: Option<u64>, payload: String) {
    let state = app.state::<Lan>();
    let conns = state.conns.lock().unwrap();
    match conn {
        Some(id) => {
            if let Some(tx) = conns.get(&id) {
                let _ = tx.send(payload);
            }
        }
        None => {
            for tx in conns.values() {
                let _ = tx.send(payload.clone());
            }
        }
    }
}
