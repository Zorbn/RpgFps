import './style.css';
import * as Three from "three";
import { Enemy } from "./enemy";
import { EntityRenderer } from "./entityRenderer";
import { Input } from "./input";
import { Player } from "./player";
import { loadTexArray } from "./resources";
import { World } from "./world";
import { MessageType } from "common";
import { sendMsg } from "./net";
import { Projectile } from './projectile';

const mainMenuElement = document.getElementById("main-menu")!;
const playButton = document.getElementById("play")!;
const ipInput = document.getElementById("ip")! as HTMLInputElement;
const port = 8080;
const mouseSensitivity = 0.002;
const maxEntities = 512;

type DrawData = {
    scene: Three.Scene,
    camera: Three.PerspectiveCamera,
    renderer: Three.WebGLRenderer,
    entityRenderer: EntityRenderer,
};

type Data = {
    drawData: DrawData,
    players: Map<number, Player>,
    enemies: Map<number, Enemy>,
    projectiles: Map<number, Projectile>,
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
    player.model.visible = false;

    sendMsg(data.socket, MessageType.MovePlayer, {
        id: data.localId,
        x: player.getX(),
        y: player.getY(),
        z: player.getZ(),
    });
};

const handleMessage = (data: Data, event: MessageEvent<any>) => {
    const msg = JSON.parse(event.data);

    switch (msg.type) {
        case MessageType.SpawnPlayer:
            data.players.set(msg.data.id, new Player(msg.data.x, msg.data.y, msg.data.z));
            break;

        case MessageType.MovePlayer:
            if (!data.players.has(msg.data.id)) return;
            if (msg.data.id == data.localId) return;
            let player = data.players.get(msg.data.id)!;
            player.setPos(msg.data.x, msg.data.y, msg.data.z);
            break;

        case MessageType.DestroyPlayer:
            data.players.delete(msg.data.id);
            break;

        case MessageType.InitClient:
            data.localId = msg.data.id;
            break;

        case MessageType.UpdateChunk:
            let msgData = msg.data;
            data.world.getChunk(msgData.x, msgData.y, msgData.z).updateData(msgData.data);
            break;

        case MessageType.SpawnEnemy:
            data.enemies.set(msg.data.id, new Enemy(msg.data.x, msg.data.y, msg.data.z));
            break;

        case MessageType.MoveEnemy:
            for (let eu of msg.data.enemyUpdates) {
                if (!data.enemies.has(eu.id)) return;
                let enemy = data.enemies.get(eu.id)!;
                enemy.setPos(eu.x, eu.y, eu.z);
            }
            break;

        case MessageType.DestroyEnemy:
            for (let id of msg.data.enemyIds) {
                data.enemies.delete(id);
            }
            break;

        case MessageType.DamageEnemy:
            for (let id of msg.data.damagedEnemyIds) {
                data.enemies.get(id)?.model.startBlink();
            }
            break;

        case MessageType.SpawnProjectile:
            data.projectiles.set(msg.data.id, new Projectile(msg.data.x, msg.data.y, msg.data.z, msg.data.dirX, msg.data.dirY, msg.data.dirZ, msg.data.type));
            break;

        case MessageType.DestroyProjectile:
            for (let id of msg.data.projectileIds) {
                data.projectiles.delete(id);
            }
            break;
    }
};

const update = (data: Data) => {
    window.requestAnimationFrame(() => { update(data) });

    const newTime = Date.now() * 0.001;
    const deltaTime = newTime - data.lastTime;
    data.lastTime = newTime

    if (deltaTime > 0.1) return;

    while (data.messageEvents.length > 0) {
        handleMessage(data, data.messageEvents.pop()!);
    }

    if (data.players.has(data.localId)) {
        updateLocal(data, deltaTime);
    }

    for (let [_id, player] of data.players) {
        player.update(data.input, data.socket, deltaTime);
    }

    for (let [_id, enemy] of data.enemies) {
        enemy.update(deltaTime);
    }

    for (let [id, projectile] of data.projectiles) {
        if (!projectile.update(deltaTime)) {
            data.projectiles.delete(id);
        }
    }

    data.world.update();
    data.drawData.entityRenderer.update(
        data.drawData.camera.position.x,
        data.drawData.camera.position.z,
        data.enemies, data.players, data.projectiles,
    );

    data.input.update();

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
            entityRenderer: new EntityRenderer(maxEntities),
        },
        players: new Map<number, Player>(),
        enemies: new Map<number, Enemy>(),
        projectiles: new Map<number, Projectile>(),
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
    const blockTexture = loadTexArray(blockImage, 16, 16);
    data.world.generate(scene, blockTexture);

    const entityImage = await imageLoader.loadAsync("res/entities.png");
    const entityTexture = loadTexArray(entityImage, 8, 8);
    data.drawData.entityRenderer.createMesh(scene, entityTexture);

    window.requestAnimationFrame(() => { update(data) });
};

let ws: WebSocket;

playButton.onclick = () => {
    if (ipInput.value.length == 0) return;

    if (ws != undefined) ws.close();
    ws = new WebSocket("ws://" + ipInput.value + ":" + port);

    ws.onopen = () => {
        start(ws);
    };
};