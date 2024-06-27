class Controls {
  constructor(type) {
    this.forward = false;
    this.left = false;
    this.right = false;
    this.reverse = false;

    switch (type) {
      case "KEYS":
        this.#addKeyBoardListeners();
        break;
      case "DUMMY":
        this.forward = true;
        break;
    }
  }

  #addKeyBoardListeners() {
    document.onkeydown = (event) => {
      switch (event.key) {
        case "ArrowLeft":
        case "A":
        case "a":
          this.left = true;
          break;
        case "ArrowRight":
        case "D":
        case "d":
          this.right = true;
          break;
        case "ArrowUp":
        case "W":
        case "w":
          this.forward = true;
          break;
        case "ArrowDown":
        case "S":
        case "s":
          this.reverse = true;
          break;
      }
      // console.table(this);
    };

    document.onkeyup = (event) => {
      switch (event.key) {
        case "ArrowLeft":
        case "A":
        case "a":
          this.left = false;
          break;
        case "ArrowRight":
        case "D":
        case "d":
          this.right = false;
          break;
        case "ArrowUp":
        case "W":
        case "w":
          this.forward = false;
          break;
        case "ArrowDown":
        case "S":
        case "s":
          this.reverse = false;
          break;
      }
      // console.table(this);
    };
  }
}
