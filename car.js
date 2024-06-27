class Car {
  constructor(x, y, width, height, controlType, maxSpeed, color = "blue") {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.speed = 0;
    this.acceleration = 0.2;
    this.maxSpeed = maxSpeed;
    this.friction = 0.05;
    this.angle = 0;
    this.damaged = false;

    this.initialX = x; // Store initial position for retry
    this.initialY = y;
    this.lastPosition = { x: x, y: y }; // Track last position for movement detection
    this.movingForward = false; // Track forward movement

    this.useBrain = controlType == "AI";
    this.controlType = controlType;

    if (controlType != "DUMMY" && controlType != "KEYS") {
      this.sensor = new Sensor(this);
      this.brain = new NeuralNetwork([this.sensor.rayCount, 6, 4]);
    }

    this.controls = new Controls(controlType);

    this.img = new Image();
    this.img.src = "car.png";

    this.mask = document.createElement("canvas");
    this.mask.width = width;
    this.mask.height = height;

    const maskCtx = this.mask.getContext("2d");
    this.img.onload = () => {
      maskCtx.fillStyle = color;
      maskCtx.rect(0, 0, this.width, this.height);
      maskCtx.fill();

      maskCtx.globalCompositeOperation = "destination-atop";
      maskCtx.drawImage(this.img, 0, 0, this.width, this.height);
    };
  }

  update(roadBorders, traffic) {
    if (!this.damaged) {
      // console.log(this.speed)
      this.#move();
      this.polygon = this.#createPolygon();
      this.damaged = this.#accessDamaged(roadBorders, traffic);

      // Track movement direction
      if (this.x !== this.lastPosition.x || this.y !== this.lastPosition.y) {
        this.movingForward = true;
        this.lastPosition = { x: this.x, y: this.y };
      } else {
        this.movingForward = false;
      }
    } else {
      // location.reload();
      this.retry();
    }

    // Additional check for standing still or reversing
    if (this.controlType === "AI" && !this.damaged && !this.movingForward) {
      this.retry(); // Retry if standing still or reversing
    }

    if (this.sensor) {
      this.sensor.update(roadBorders, traffic);
      const offsets = this.sensor.readings.map((s) =>
        s == null ? 0 : 1 - s.offset
      );

      const outputs = NeuralNetwork.feedForward(offsets, this.brain);
      console.log(outputs);

      if (this.useBrain) {
        this.controls.forward = outputs[0];
        this.controls.left = outputs[1];
        this.controls.right = outputs[2];
        this.controls.reverse = outputs[3];
      }
    }
  }

  retry() {
    // Reset car to initial position and state
    this.x = this.initialX;
    this.y = this.initialY;
    this.speed = 0;
    this.angle = 0;
    this.damaged = false; // Reset damage flag
    this.movingForward = false; // Reset movement tracking

    // Additional reset logic if needed
    // Example: Reset neural network or other AI-related state
    if (this.controlType === "AI" && this.brain) {
      this.brain = new NeuralNetwork([this.sensor.rayCount, 6, 4]); // Example reset of neural network
    }
  }

  #accessDamaged(roadBorders, traffic) {
    for (let i = 0; i < roadBorders.length; i++) {
      if (polysIntersect(this.polygon, roadBorders[i])) {
        return true;
      }
    }

    for (let i = 0; i < traffic.length; i++) {
      if (polysIntersect(this.polygon, traffic[i].polygon)) {
        return true;
      }
    }

    return false;
  }

  #createPolygon() {
    const points = [];
    const rad = Math.hypot(this.width, this.height) / 2;
    const alpha = Math.atan2(this.width, this.height);
    points.push({
      x: this.x - Math.sin(this.angle - alpha) * rad,
      y: this.y - Math.cos(this.angle - alpha) * rad,
    });
    points.push({
      x: this.x - Math.sin(this.angle + alpha) * rad,
      y: this.y - Math.cos(this.angle + alpha) * rad,
    });
    points.push({
      x: this.x - Math.sin(Math.PI + this.angle - alpha) * rad,
      y: this.y - Math.cos(Math.PI + this.angle - alpha) * rad,
    });
    points.push({
      x: this.x - Math.sin(Math.PI + this.angle + alpha) * rad,
      y: this.y - Math.cos(Math.PI + this.angle + alpha) * rad,
    });

    return points;
  }

  #move() {
    if (this.controls.forward) {
      this.speed += this.acceleration;
    }
    if (this.controls.reverse) {
      this.speed -= this.acceleration;
    }

    if (this.speed > this.maxSpeed) {
      this.speed = this.maxSpeed;
    }

    if (this.speed < -this.maxSpeed / 2) {
      this.speed = -this.maxSpeed / 2;
    }

    if (this.speed > 0) {
      this.speed -= this.friction;
    }

    // Ensure car does not reverse in AI mode
    if (this.speed < 0 && this.controlType == "AI") {
      this.speed = 0;
    }

    if (this.speed < 0) {
      this.speed += this.friction;
    }

    // Apply friction
    if (Math.abs(this.speed) > this.friction) {
      this.speed -= this.friction * Math.sign(this.speed);
    } else {
      this.speed = 0;
    }

    if (this.speed != 0) {
      const flip = this.speed > 0 ? 1 : -1;
      if (this.controls.left) {
        this.angle += 0.03 * flip;
      }

      if (this.controls.right) {
        this.angle -= 0.03 * flip;
      }
    }

    this.x -= Math.sin(this.angle) * this.speed;
    this.y -= Math.cos(this.angle) * this.speed;
  }

  draw(ctx, drawSensor = false) {
    if (this.sensor && drawSensor) {
      this.sensor.draw(ctx);
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(-this.angle);
    if (!this.damaged) {
      ctx.drawImage(
        this.mask,
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      );
      ctx.globalCompositeOperation = "multiply";
    }
    ctx.drawImage(
      this.img,
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );
    ctx.restore();
  }
}
