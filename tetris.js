const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-block');
const nextContext = nextCanvas.getContext('2d');

context.scale(30, 30);
nextContext.scale(30, 30);

const COLORS = [
  null, '#c6a0f6', '#eed49f', '#f5a97f', '#8aadf4', '#8bd5ca', '#a6da95', '#ed8796'
];

function createMatrix(w, h) {
  const matrix = [];
  while (h--) matrix.push(new Array(w).fill(0));
  return matrix;
}
let arena = createMatrix(10, 20);

// 타입 추적을 위해 객체 형태로 변경
function createPiece(type) {
  let matrix;
  if (type === 'T') matrix = [[0, 1, 0], [1, 1, 1], [0, 0, 0]];
  else if (type === 'O') matrix = [[2, 2], [2, 2]];
  else if (type === 'L') matrix = [[0, 0, 3], [3, 3, 3], [0, 0, 0]];
  else if (type === 'J') matrix = [[4, 0, 0], [4, 4, 4], [0, 0, 0]];
  else if (type === 'I') matrix = [[0, 0, 0, 0], [5, 5, 5, 5], [0, 0, 0, 0], [0, 0, 0, 0]];
  else if (type === 'S') matrix = [[0, 6, 6], [6, 6, 0], [0, 0, 0]];
  else if (type === 'Z') matrix = [[7, 7, 0], [0, 7, 7], [0, 0, 0]];
  return { matrix, type };
}

function collide(arena, player) {
  const m = player.matrix;
  const o = player.pos;
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0) {
        const boardY = y + o.y;
        const boardX = x + o.x;
        if (boardX < 0 || boardX >= 10 || boardY >= 20 || (boardY >= 0 && arena[boardY][boardX] !== 0)) {
          return true;
        }
      }
    }
  }
  return false;
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        const targetY = y + player.pos.y;
        // 천장을 넘어서 저장되는 것 방지
        if (targetY >= 0) arena[targetY][x + player.pos.x] = value;
      }
    });
  });
}

// T-스핀 판정 로직
function checkTSpin() {
  if (player.type !== 'T' || lastAction !== 'rotate') return false;

  let occupiedCorners = 0;
  const corners = [[0, 0], [2, 0], [0, 2], [2, 2]]; // T 미노 3x3 배열의 네 모서리

  corners.forEach(([cx, cy]) => {
    const boardX = player.pos.x + cx;
    const boardY = player.pos.y + cy;
    // 벽이거나 블록이 있으면 카운트 증가
    if (boardX < 0 || boardX >= 10 || boardY >= 20 || boardY < 0 || arena[boardY][boardX] !== 0) {
      occupiedCorners++;
    }
  });

  return occupiedCorners >= 3;
}

// 줄 삭제 및 점수 계산
function arenaSweep() {
  let linesCleared = 0;
  let isTSpin = checkTSpin();

  outer: for (let y = arena.length - 1; y >= 0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      if (arena[y][x] === 0) continue outer;
    }
    const row = arena.splice(y, 1)[0].fill(0);
    arena.unshift(row);
    ++linesCleared;
    ++y; // 위에서 내려온 줄도 검사
  }

  if (linesCleared > 0) {
    if (linesCleared === 4) {
      score += 10; // 테트리스(I미노 4줄)
    } else if (isTSpin) {
      score += 10; // T-스핀 라인 클리어
    } else {
      score += linesCleared; // 일반 라인 클리어 (1줄당 1점)
    }
  } else if (isTSpin) {
    // 라인 클리어가 없는 T스핀도 10점 추가 여부 처리 (요청에 따라 포함)
    score += 10;
  }

  updateScoreUI();
}

function drawMatrix(matrix, offset, ctx = context) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        ctx.fillStyle = COLORS[value];
        ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

function draw() {
  context.fillStyle = '#363a4f';
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawMatrix(arena, { x: 0, y: 0 });
  drawMatrix(player.matrix, player.pos);
  drawNext();
}

function drawNext() {
  nextContext.fillStyle = '#363a4f';
  nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
  const offset = { x: (4 - nextBlock.matrix[0].length) / 2, y: (4 - nextBlock.matrix.length) / 2 };
  drawMatrix(nextBlock.matrix, offset, nextContext);
}

function rotate(matrix) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  matrix.forEach(row => row.reverse());
}

function playerRotate() {
  const pos = player.pos.x;
  rotate(player.matrix);
  let offset = 1;
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix);
      rotate(player.matrix);
      rotate(player.matrix);
      player.pos.x = pos;
      return;
    }
  }
  lastAction = 'rotate'; // T-스핀 체크를 위한 마지막 액션 기록
}

const PIECES = 'TOLJISZ';
function getRandomPiece() {
  return createPiece(PIECES[Math.floor(Math.random() * PIECES.length)]);
}

let player = { pos: { x: 0, y: 0 }, matrix: null, type: null };
let nextBlock = getRandomPiece();
let score = 0;
let lastAction = 'spawn';
let isGameOver = false;
let animationId;

function updateScoreUI() {
  document.getElementById('score').innerText = score;
}

function playerReset() {
  player.matrix = nextBlock.matrix;
  player.type = nextBlock.type;
  player.pos.y = 0;
  player.pos.x = Math.floor((10 - player.matrix[0].length) / 2);
  nextBlock = getRandomPiece();
  lockStartTime = null;
  lastAction = 'spawn';

  // 생성되자마자 충돌하면 (천장에 닿음) 게임 오버
  if (collide(arena, player)) {
    gameOver();
  }
}

function gameOver() {
  isGameOver = true;
  cancelAnimationFrame(animationId); // 게임 루프 정지

  // 최고 점수 갱신
  let highScore = localStorage.getItem('tetrisHighScore') || 0;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('tetrisHighScore', highScore);
  }

  // 모달 UI 업데이트 및 표시
  document.getElementById('modal-score').innerText = score;
  document.getElementById('modal-highscore').innerText = highScore;
  document.getElementById('game-over-modal').classList.remove('hidden');
}

// 다시 시작 버튼 이벤트
document.getElementById('restart-btn').addEventListener('click', () => {
  arena = createMatrix(10, 20); // 보드 초기화
  score = 0;
  updateScoreUI();
  isGameOver = false;
  document.getElementById('game-over-modal').classList.add('hidden');
  playerReset();
  update();
});

let dropCounter = 0;
let dropInterval = 1000;
let lockStartTime = null;
let lastTime = 0;

function update(time = 0) {
  if (isGameOver) return; // 게임 오버면 업데이트 중지

  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;

  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    if (lockStartTime === null) {
      lockStartTime = time;
    } else if (time - lockStartTime >= 1000) {
      merge(arena, player);
      arenaSweep();
      playerReset();
    }
  } else {
    player.pos.y--;
    lockStartTime = null;
    if (dropCounter > dropInterval) {
      player.pos.y++;
      if (collide(arena, player)) player.pos.y--;
      else lastAction = 'drop'; // 하강
      dropCounter = 0;
    }
  }

  draw();
  animationId = requestAnimationFrame(update);
}

document.addEventListener('keydown', event => {
  if (isGameOver) return; // 게임 오버 상태일 땐 조작 무시

  const key = event.key;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(key)) {
    event.preventDefault();
  }

  if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
    player.pos.x--;
    if (collide(arena, player)) player.pos.x++;
    else lastAction = 'move';
  } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
    player.pos.x++;
    if (collide(arena, player)) player.pos.x--;
    else lastAction = 'move';
  } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
    player.pos.y++;
    if (collide(arena, player)) player.pos.y--;
    else lastAction = 'move';
    dropCounter = 0;
  } else if (key === 'ArrowUp' || key === 'w' || key === 'W') {
    playerRotate();
  }
});

// 게임 최초 시작
playerReset();
update();