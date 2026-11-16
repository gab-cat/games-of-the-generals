// Compact replay format for finished games.
//
// A finished game used to keep one `moves` row per move (about 300 bytes plus
// four index entries each) and a full `initialSetupBoard` (about 2.6 KB). The
// archive job packs both into short strings on the game row and deletes the
// move rows. A 100-move game drops from roughly 35 KB to under 1 KB.
//
// Format v1
// - setup: 72 cells, row-major, 2 chars per cell. ".." is empty, otherwise the
//   owner ("1" or "2") followed by the piece code.
// - moves: one token per move, back to back.
//     plain move: fromRow fromCol toRow toCol pieceCode "-"            (6 chars)
//     challenge:  fromRow fromCol toRow toCol pieceCode result defCode (7 chars)
//   result is "a" (attacker won), "d" (defender won) or "t" (tie).
//
// Piece codes are base-36 digits of each piece's index in PIECE_CODES. Never
// reorder that list: archived games decode with it.

export const PIECE_CODES = [
  "Flag",
  "Private",
  "Sergeant",
  "2nd Lieutenant",
  "1st Lieutenant",
  "Captain",
  "Major",
  "Lieutenant Colonel",
  "Colonel",
  "1 Star General",
  "2 Star General",
  "3 Star General",
  "4 Star General",
  "5 Star General",
  "Spy",
] as const;

export const BOARD_ROWS = 8;
export const BOARD_COLS = 9;

type Player = "player1" | "player2";
type Winner = "attacker" | "defender" | "tie";

export type BoardCell = {
  piece: string;
  player: Player;
  revealed: boolean;
} | null;

export type ArchivableMove = {
  moveType: "move" | "challenge" | "setup";
  fromRow?: number;
  fromCol?: number;
  toRow: number;
  toCol: number;
  piece?: string;
  challengeResult?: {
    attacker: string;
    defender: string;
    winner: Winner;
  };
};

export type DecodedMove = {
  moveType: "move" | "challenge";
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  piece: string;
  player: Player;
  challengeResult?: {
    attacker: string;
    defender: string;
    winner: Winner;
  };
};

const WINNER_TO_CODE: Record<Winner, string> = {
  attacker: "a",
  defender: "d",
  tie: "t",
};
const CODE_TO_WINNER: Record<string, Winner> = {
  a: "attacker",
  d: "defender",
  t: "tie",
};

function pieceCode(piece: string): string {
  const index = PIECE_CODES.indexOf(piece as (typeof PIECE_CODES)[number]);
  if (index === -1) throw new Error(`Unknown piece "${piece}"`);
  return index.toString(36);
}

function pieceFromCode(code: string): string {
  const piece = PIECE_CODES[parseInt(code, 36)];
  if (!piece) throw new Error(`Unknown piece code "${code}"`);
  return piece;
}

function digit(value: number | undefined, max: number, label: string): string {
  if (value === undefined || !Number.isInteger(value) || value < 0 || value >= max) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
  return String(value);
}

export function encodeSetup(board: BoardCell[][]): string {
  if (board.length !== BOARD_ROWS) throw new Error("Board must have 8 rows");
  let out = "";
  for (const row of board) {
    if (row.length !== BOARD_COLS) throw new Error("Board rows must have 9 cells");
    for (const cell of row) {
      if (!cell) {
        out += "..";
      } else {
        out += (cell.player === "player1" ? "1" : "2") + pieceCode(cell.piece);
      }
    }
  }
  return out;
}

// Pieces in a setup are always hidden; replays reveal them as battles happen.
export function decodeSetup(encoded: string): BoardCell[][] {
  if (encoded.length !== BOARD_ROWS * BOARD_COLS * 2) {
    throw new Error("Invalid setup length");
  }
  const board: BoardCell[][] = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    const row: BoardCell[] = [];
    for (let c = 0; c < BOARD_COLS; c++) {
      const i = (r * BOARD_COLS + c) * 2;
      const owner = encoded[i];
      if (owner === ".") {
        row.push(null);
      } else {
        row.push({
          piece: pieceFromCode(encoded[i + 1]),
          player: owner === "1" ? "player1" : "player2",
          revealed: false,
        });
      }
    }
    board.push(row);
  }
  return board;
}

// Setup rows are not part of a replay; callers skip them before encoding.
export function encodeMoves(moves: ArchivableMove[]): string {
  let out = "";
  for (const move of moves) {
    if (move.moveType === "setup") continue;
    if (!move.piece) throw new Error("Move is missing its piece");
    const head =
      digit(move.fromRow, BOARD_ROWS, "fromRow") +
      digit(move.fromCol, BOARD_COLS, "fromCol") +
      digit(move.toRow, BOARD_ROWS, "toRow") +
      digit(move.toCol, BOARD_COLS, "toCol") +
      pieceCode(move.piece);
    if (move.moveType === "challenge") {
      if (!move.challengeResult) throw new Error("Challenge is missing its result");
      if (move.challengeResult.attacker !== move.piece) {
        throw new Error("Challenge attacker does not match the moving piece");
      }
      out +=
        head +
        WINNER_TO_CODE[move.challengeResult.winner] +
        pieceCode(move.challengeResult.defender);
    } else {
      out += head + "-";
    }
  }
  return out;
}

// The mover is read from the board as it stood before each move, so the
// replay needs the setup to name players. Without a setup, player is the
// alternating turn order starting with player1.
export function decodeMoves(encoded: string, setup?: BoardCell[][]): DecodedMove[] {
  const moves: DecodedMove[] = [];
  const board = setup?.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
  let i = 0;
  while (i < encoded.length) {
    const fromRow = Number(encoded[i]);
    const fromCol = Number(encoded[i + 1]);
    const toRow = Number(encoded[i + 2]);
    const toCol = Number(encoded[i + 3]);
    const piece = pieceFromCode(encoded[i + 4]);
    const marker = encoded[i + 5];
    if (marker === undefined) throw new Error("Truncated move");

    const mover = board?.[fromRow]?.[fromCol];
    const player: Player = mover
      ? mover.player
      : moves.length % 2 === 0
        ? "player1"
        : "player2";

    if (marker === "-") {
      moves.push({ moveType: "move", fromRow, fromCol, toRow, toCol, piece, player });
      if (board) {
        board[toRow][toCol] = board[fromRow][fromCol];
        board[fromRow][fromCol] = null;
      }
      i += 6;
    } else {
      const winner = CODE_TO_WINNER[marker];
      const defenderCode = encoded[i + 6];
      if (!winner || defenderCode === undefined) throw new Error("Invalid challenge");
      const defender = pieceFromCode(defenderCode);
      moves.push({
        moveType: "challenge",
        fromRow,
        fromCol,
        toRow,
        toCol,
        piece,
        player,
        challengeResult: { attacker: piece, defender, winner },
      });
      if (board) {
        if (winner === "attacker") board[toRow][toCol] = board[fromRow][fromCol];
        if (winner === "tie") board[toRow][toCol] = null;
        board[fromRow][fromCol] = null;
      }
      i += 7;
    }
  }
  return moves;
}
