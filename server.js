const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;

const wss = new WebSocket.Server({
    port: PORT
});

const MAX_JUGADORES = 5;

const jugadores = new Map();

console.log("🌐 Servidor Comelón de Manzana iniciado");
console.log("🚀 Puerto:", PORT);

function enviarTodos(mensaje) {

    const datos = JSON.stringify(mensaje);

    wss.clients.forEach(cliente => {

        if (cliente.readyState === WebSocket.OPEN) {

            cliente.send(datos);

        }

    });

}

function obtenerJugadores() {

    return Array.from(jugadores.values()).map(jugador => {

        return {

            id: jugador.id,

            nombre: jugador.nombre,

            x: jugador.x,

            y: jugador.y,

            puntos: jugador.puntos,

            vivo: jugador.vivo

        };

    });

}

wss.on("connection", function(ws) {

    console.log("📱 Nuevo jugador conectado");

    if (jugadores.size >= MAX_JUGADORES) {

        ws.send(JSON.stringify({

            tipo: "servidor_lleno",

            mensaje: "El servidor está lleno"

        }));

        ws.close();

        return;

    }

    const id =

        Date.now().toString() +

        Math.random().toString(36).substring(2);

    ws.jugadorId = id;

    ws.on("message", function(mensaje) {

        try {

            const datos = JSON.parse(mensaje);

            if (datos.tipo === "entrar") {

                const jugador = {

                    id: id,

                    nombre: datos.nombre || "Jugador",

                    x: 10,

                    y: 10,

                    puntos: 0,

                    vivo: true,

                    ws: ws

                };

                jugadores.set(id, jugador);

                console.log(

                    "🐛 Entró:",

                    jugador.nombre

                );

                enviarTodos({

                    tipo: "jugadores",

                    jugadores: obtenerJugadores()

                });

                return;

            }

            const jugador = jugadores.get(id);

            if (!jugador) return;

            if (datos.tipo === "movimiento") {

                jugador.x = datos.x;

                jugador.y = datos.y;

                enviarTodos({

                    tipo: "jugadores",

                    jugadores: obtenerJugadores()

                });

            }

            if (datos.tipo === "puntos") {

                jugador.puntos = datos.puntos;

                enviarTodos({

                    tipo: "jugadores",

                    jugadores: obtenerJugadores()

                });

            }

            if (datos.tipo === "morir") {

                jugador.vivo = false;

                enviarTodos({

                    tipo: "jugador_muerto",

                    id: jugador.id,

                    nombre: jugador.nombre,

                    puntos: jugador.puntos

                });

                enviarTodos({

                    tipo: "jugadores",

                    jugadores: obtenerJugadores()

                });

            }

        }

        catch(error) {

            console.log(

                "❌ Error:",

                error.message

            );

        }

    });

    ws.on("close", function() {

        const jugador = jugadores.get(id);

        if (jugador) {

            console.log(

                "👋 Salió:",

                jugador.nombre

            );

            jugadores.delete(id);

        }

        enviarTodos({

            tipo: "jugadores",

            jugadores: obtenerJugadores()

        });

    });

});