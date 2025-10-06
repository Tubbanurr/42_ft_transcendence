export class TwoPlayerPongGame 
{
    private ctx: CanvasRenderingContext2D;
    private width: number;
    private height: number;

    private paddles = [
      { x: 20, y: 160 },
      { x: 800 - 10 - 20, y: 160 }
    ];
    private ball = { x: 400, y: 200 };
    private scores: [number, number] = [0, 0];

    constructor(canvas: HTMLCanvasElement) 
    {
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context alınamadı");
      this.ctx = ctx;
      this.width = canvas.width;
      this.height = canvas.height;
      this.draw();
    }

    public updateFromServer(state: any) {
      if (state?.paddles) {
        this.paddles[0].y = state.paddles[0].y;
        this.paddles[1].y = state.paddles[1].y;
      }
      if (state?.ball) {
        this.ball.x = state.ball.x;
        this.ball.y = state.ball.y;
      }
      if (state?.scores) {
        this.scores = state.scores;
        const p1 = document.getElementById("player1Score");
        const p2 = document.getElementById("player2Score");
        if (p1) p1.textContent = String(this.scores[0]);
        if (p2) p2.textContent = String(this.scores[1]);
      }
      this.draw();
    }

    public destroy() {}

    private draw() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.setLineDash([8, 12]);
      ctx.beginPath();
      ctx.moveTo(this.width / 2, 0);
      ctx.lineTo(this.width / 2, this.height);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(this.ball.x, this.ball.y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#2357ff";
      ctx.fillRect(this.paddles[0].x, this.paddles[0].y, 10, 80);

      ctx.fillStyle = "#19b35a";
      ctx.fillRect(this.paddles[1].x, this.paddles[1].y, 10, 80);
    }
  }
