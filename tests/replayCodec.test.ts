import { describe, expect, test } from "bun:test";
import {
  BoardCell,
  PIECE_CODES,
  decodeMoves,
  decodeSetup,
  encodeMoves,
  encodeSetup,
  type ArchivableMove,
} from "../convex/lib/replayCodec";

function emptyBoard(): BoardCell[][] {
  return Array.from({ length: 8 }, () => Array.from({ length: 9 }, () => null));
}

function sampleSetup(): BoardCell[][] {
  const board = emptyBoard();
  // Every piece type once per side, so every code round-trips.
  PIECE_CODES.forEach((piece, i) => {
    board[7 - Math.floor(i / 9)][i % 9] = { piece, player: "player1", revealed: false };
    board[Math.floor(i / 9)][i % 9] = { piece, player: "player2", revealed: true };
  });
  return board;
}

describe("setup", () => {
  test("round-trips every piece and owner, and hides pieces", () => {
    const setup = sampleSetup();
    const encoded = encodeSetup(setup);
    expect(encoded.length).toBe(144);
    const decoded = decodeSetup(encoded);
    decoded.forEach((row, r) =>
      row.forEach((cell, c) => {
        const original = setup[r][c];
        if (!original) return expect(cell).toBeNull();
        expect(cell).toEqual({ piece: original.piece, player: original.player, revealed: false });
      }),
    );
  });

  test("rejects unknown pieces and bad shapes", () => {
    const board = emptyBoard();
    board[0][0] = { piece: "Admiral", player: "player1", revealed: false };
    expect(() => encodeSetup(board)).toThrow();
    expect(() => encodeSetup(emptyBoard().slice(1))).toThrow();
    expect(() => decodeSetup("..")).toThrow();
  });
});

describe("moves", () => {
  const setup = sampleSetup();
  // player1 Private at (7,1) moves up, player2 Private at (0,1) moves down,
  // then a challenge: player1 Spy (6,5) attacks player2 Captain placed at (5,5).
  setup[5][5] = { piece: "Captain", player: "player2", revealed: false };
  const moves: ArchivableMove[] = [
    { moveType: "setup", toRow: 0, toCol: 0 },
    { moveType: "move", fromRow: 7, fromCol: 1, toRow: 6, toCol: 1, piece: "Private" },
    { moveType: "move", fromRow: 0, fromCol: 1, toRow: 1, toCol: 1, piece: "Private" },
    {
      moveType: "challenge",
      fromRow: 6,
      fromCol: 5,
      toRow: 5,
      toCol: 5,
      piece: "Spy",
      challengeResult: { attacker: "Spy", defender: "Captain", winner: "attacker" },
    },
    {
      moveType: "challenge",
      fromRow: 1,
      fromCol: 1,
      toRow: 2,
      toCol: 1,
      piece: "Private",
      challengeResult: { attacker: "Private", defender: "Private", winner: "tie" },
    },
  ];

  test("skips setup rows and round-trips moves and battles", () => {
    const encoded = encodeMoves(moves);
    expect(encoded.length).toBe(6 + 6 + 7 + 7);
    const decoded = decodeMoves(encoded, setup);
    expect(decoded.map(({ player: _p, ...m }) => m)).toEqual(
      moves.slice(1).map((m) => ({
        moveType: m.moveType,
        fromRow: m.fromRow,
        fromCol: m.fromCol,
        toRow: m.toRow,
        toCol: m.toCol,
        piece: m.piece,
        ...(m.challengeResult ? { challengeResult: m.challengeResult } : {}),
      })),
    );
  });

  test("reads the mover from the board", () => {
    const decoded = decodeMoves(encodeMoves(moves), setup);
    expect(decoded.map((m) => m.player)).toEqual(["player1", "player2", "player1", "player2"]);
  });

  test("falls back to turn order without a setup", () => {
    const decoded = decodeMoves(encodeMoves(moves));
    expect(decoded.map((m) => m.player)).toEqual(["player1", "player2", "player1", "player2"]);
  });

  test("an empty game encodes to an empty string", () => {
    expect(encodeMoves([])).toBe("");
    expect(decodeMoves("")).toEqual([]);
  });

  test("refuses data it cannot store faithfully", () => {
    expect(() => encodeMoves([{ moveType: "move", fromRow: 8, fromCol: 0, toRow: 7, toCol: 0, piece: "Spy" }])).toThrow();
    expect(() => encodeMoves([{ moveType: "move", fromRow: 1, fromCol: 0, toRow: 2, toCol: 0 }])).toThrow();
    expect(() =>
      encodeMoves([
        {
          moveType: "challenge",
          fromRow: 1,
          fromCol: 0,
          toRow: 2,
          toCol: 0,
          piece: "Spy",
          challengeResult: { attacker: "Major", defender: "Flag", winner: "attacker" },
        },
      ]),
    ).toThrow();
    expect(() => decodeMoves("71611")).toThrow();
  });

  test("a 100-move game packs to under 1 KB", () => {
    const long: ArchivableMove[] = Array.from({ length: 100 }, (_, i) => ({
      moveType: i % 5 === 0 ? "challenge" : "move",
      fromRow: 3,
      fromCol: i % 9,
      toRow: 4,
      toCol: i % 9,
      piece: "Major",
      ...(i % 5 === 0
        ? { challengeResult: { attacker: "Major", defender: "Captain", winner: "attacker" as const } }
        : {}),
    }));
    expect(encodeMoves(long).length).toBeLessThan(1024);
  });
});
