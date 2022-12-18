import * as Three from "three";
import { Input } from "./input";
import { Player } from "./player";
import { loadTexArray } from "./resources";
import './style.css';
import { World } from "./world";

const mainMenuElement = document.getElementById("main-menu")!;
const playButton = document.getElementById("play")!;
const ipInput = document.getElementById("ip")! as HTMLInputElement;
const port = 8080;
const mouseSensitivity = 0.002;

enum MessageType {
    SpawnPlayer,
    MovePlayer,
    InitClient,
    UpdateChunk,
};

const sendMsg = (socket: WebSocket, type: MessageType, data: object) => {
    socket.send(JSON.stringify({
        type,
        data,
    }));
};

type DrawData = {
    scene: Three.Scene,
    camera: Three.PerspectiveCamera,
    renderer: Three.WebGLRenderer,
};

type Data = {
    drawData: DrawData,
    players: Map<number, Player>,
    localId: number,
    input: Input,
    lastTime: number,
    socket: WebSocket,
    world: World,
    messageEvents: MessageEvent<any>[],
};

const draw = (data: DrawData) => {
    data.renderer.render(data.scene, data.camera);
};

const updateLocal = (data: Data, deltaTime: number) => {
    let player = data.players.get(data.localId)!;
    let moveX = 0;
    let moveZ = 0;

    if (data.input.isKeyPressed("KeyA")) {
        moveX += 1;
    }

    if (data.input.isKeyPressed("KeyD")) {
        moveX -= 1;
    }

    if (data.input.isKeyPressed("KeyS")) {
        moveZ -= 1;
    }

    if (data.input.isKeyPressed("KeyW")) {
        moveZ += 1;
    }

    if (moveX != 0 || moveZ != 0) {
        const mag = Math.sqrt(moveX * moveX + moveZ * moveZ);
        moveX /= mag;
        moveZ /= mag;

        player.move(moveX, moveZ, deltaTime);
    }

    player.moveCamera(data.drawData.camera);
    player.setVisible(false);

    sendMsg(data.socket, MessageType.MovePlayer, {
        id: data.localId,
        x: player.getX(),
        y: player.getY(),
        z: player.getZ(),
    });
};

const handleMessage = (data: Data, event: MessageEvent<any>) => {
    const msg = JSON.parse(event.data);

    if (msg.type == MessageType.SpawnPlayer) {
        data.players.set(msg.data.id, new Player(data.drawData.scene, msg.data.x, msg.data.y, msg.data.z, msg.data.size))
    } else if (msg.type == MessageType.MovePlayer) {
        if (!data.players.has(msg.data.id)) return;
        if (msg.data.id == data.localId) return;
        let player = data.players.get(msg.data.id)!;
        player.setPos(msg.data.x, msg.data.y, msg.data.z);
    } else if (msg.type == MessageType.InitClient) {
        data.localId = msg.data.id;
    } else if (msg.type == MessageType.UpdateChunk) {
        let msgData = msg.data;
        data.world.getChunk(msgData.x, msgData.y, msgData.z).updateData(msgData.data);
    }
};

const update = (data: Data) => {
    window.requestAnimationFrame(() => { update(data) });

    const newTime = Date.now() * 0.001;
    const deltaTime = newTime - data.lastTime;
    data.lastTime = newTime

    if (deltaTime > 0.01) return;

    while (data.messageEvents.length > 0) {
        handleMessage(data, data.messageEvents.pop()!);
    }

    if (data.players.has(data.localId)) {
        updateLocal(data, deltaTime);
    }

    for (let [_id, player] of data.players) {
        player.interpolateModel(deltaTime);
    }

    data.world.update();

    draw(data.drawData);
};

const start = async (ws: WebSocket) => {
    mainMenuElement.style.display = "none";

    const scene = new Three.Scene();
    const camera = new Three.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 100);
    const renderer = new Three.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    let input = new Input();

    let data: Data = {
        drawData: {
            scene,
            camera,
            renderer,
        },
        players: new Map<number, Player>(),
        localId: -1,
        input,
        lastTime: 0,
        socket: ws,
        world: new World(32, 8, 2, 1),
        messageEvents: [],
    };

    input.addListeners((event) => {
        if (!data.players.has(data.localId)) return;

        let player = data.players.get(data.localId)!;
        player.rotate(camera, -event.movementY * mouseSensitivity, -event.movementX * mouseSensitivity);
    }, true);

    ws.onmessage = (event) => {
        data.messageEvents.push(event);
    };

    window.onresize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const imageLoader = new Three.ImageLoader();
    const blockImage = await imageLoader.loadAsync("res/blocks.png");
    const blockTexture = loadTexArray(blockImage, 16, 32);
    data.world.generate(scene, blockTexture);

    window.requestAnimationFrame(() => { update(data) });
};

playButton.onclick = () => {
    if (ipInput.value.length == 0) return;

    const ws = new WebSocket("ws://" + ipInput.value + ":" + port);
    ws.onopen = async () => {
        await start(ws);
    };
};