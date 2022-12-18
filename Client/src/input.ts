export class Input {
    private pressedKeys: Set<string>;
    private pressedMouseButtons: Set<number>;
    private keyWasPressed: Set<string>;
    private mouseButtonWasPressed: Set<number>;
    private onMouseMove?: (ev: MouseEvent) => any;
    private clickListener?: () => any;
    private pointerLockChangeListener?: () => any;
    private keyDownListener?: (ev: KeyboardEvent) => any;
    private keyUpListener?: (ev: KeyboardEvent) => any;
    private mouseDownListener?: (ev: MouseEvent) => any;
    private mouseUpListener?: (ev: MouseEvent) => any;
    private hasListeners: boolean;

    constructor() {
        this.pressedKeys = new Set();
        this.pressedMouseButtons = new Set();
        this.keyWasPressed = new Set();
        this.mouseButtonWasPressed = new Set();
        this.hasListeners = false;
    }

    isKeyPressed = (key: string) => {
        return this.pressedKeys.has(key);
    }

    wasKeyPressed = (key: string) => {
        return this.keyWasPressed.has(key);
    }

    wasMouseButtonPressed = (button: number) => {
        return this.mouseButtonWasPressed.has(button);
    }

    isMouseButtonPressed = (button: number) => {
        return this.pressedMouseButtons.has(button);
    }

    update = () => {
        this.keyWasPressed.clear();
        this.mouseButtonWasPressed.clear();
    }

    addListeners = (onMouseMove: (ev: MouseEvent) => any, grabMouseNow: boolean) => {
        this.hasListeners = true;

        this.onMouseMove = onMouseMove;

        this.clickListener = () => {
            document.body.requestPointerLock();
        }
        document.addEventListener("click", this.clickListener);

        this.pointerLockChangeListener = () => {
            if (document.pointerLockElement == document.body) {
                document.addEventListener("mousemove", this.onMouseMove!);
            } else {
                document.removeEventListener("mousemove", this.onMouseMove!);
                this.pressedKeys.clear();
                this.pressedMouseButtons.clear();
            }
        }
        document.addEventListener("pointerlockchange", this.pointerLockChangeListener);

        this.keyDownListener = (event: KeyboardEvent) => {
            if (!this.pressedKeys.has(event.code)) {
                this.keyWasPressed.add(event.code);
            }

            this.pressedKeys.add(event.code);
        }
        document.addEventListener("keydown", this.keyDownListener);

        this.keyUpListener = (event: KeyboardEvent) => {
            this.pressedKeys.delete(event.code);
        }
        document.addEventListener("keyup", this.keyUpListener);

        this.mouseDownListener = (event: MouseEvent) => {
            if (!this.pressedMouseButtons.has(event.button)) {
                this.mouseButtonWasPressed.add(event.button);
            }

            this.pressedMouseButtons.add(event.button);
        }
        document.addEventListener("mousedown", this.mouseDownListener)
this.mouseUpListener = (event) => {
            this.pressedMouseButtons.delete(event.button);
        };
        document.addEventListener("mouseup", this.mouseUpListener);

        if (grabMouseNow) {
            this.clickListener();
        }
    }

    removeListeners = () => {
        this.hasListeners = false;

        document.removeEventListener("mousemove", this.onMouseMove!);
        document.removeEventListener("click", this.clickListener!);
        document.removeEventListener("pointerlockchange", this.pointerLockChangeListener!);
        document.removeEventListener("keydown", this.keyDownListener!);
        document.removeEventListener("keyup", this.keyUpListener!);
        document.removeEventListener("mousedown", this.mouseDownListener!)
        document.removeEventListener("mouseup", this.mouseUpListener!);

        this.pressedKeys.clear();
        this.pressedMouseButtons.clear();
        this.keyWasPressed.clear();
        this.mouseButtonWasPressed.clear();
    }

    unlockPointer = () => {
        document.exitPointerLock();
    }
}