"use client";

import { useState, useEffect } from "react";
import { Share } from "@/components/share";
import { url } from "@/lib/metadata";

const SIZE = 4;
const TILE_PROBABILITIES = [0.9, 0.1];

function randomTile() {
  return Math.random() < TILE_PROBABILITIES[0] ? 2 : 4;
}

function emptyPositions(board: number[][]) {
  const positions: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) positions.push([r, c]);
    }
  }
  return positions;
}

function addRandomTile(board: number[][]) {
  const empties = emptyPositions(board);
  if (empties.length === 0) return board;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  const newBoard = board.map(row => [...row]);
  newBoard[r][c] = randomTile();
  return newBoard;
}

function slideAndMerge(row: number[]) {
  const filtered = row.filter(v => v !== 0);
  const merged: number[] = [];
  let skip = false;
  for (let i = 0; i < filtered.length; i++) {
    if (skip) {
      skip = false;
      continue;
    }
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      merged.push(filtered[i] * 2);
      skip = true;
    } else {
      merged.push(filtered[i]);
    }
  }
  while (merged.length < SIZE) merged.push(0);
  return merged;
}

function transpose(board: number[][]) {
  return board[0].map((_, i) => board.map(row => row[i]));
}

function reverse(board: number[][]) {
  return board.map(row => [...row].reverse());
}

function move(board: number[][], dir: "up" | "down" | "left" | "right") {
  let newBoard = board;
  if (dir === "up") newBoard = transpose(newBoard);
  if (dir === "down") newBoard = reverse(transpose(newBoard));
  if (dir === "right") newBoard = reverse(newBoard);

  let moved = newBoard.map(row => slideAndMerge(row));

  if (dir === "up") moved = transpose(moved);
  if (dir === "down") moved = transpose(reverse(moved));
  if (dir === "right") moved = reverse(moved);

  return moved;
}

export default function Game2048() {
  const [board, setBoard] = useState<number[][]>(Array.from({ length: SIZE }, () => Array(SIZE).fill(0)));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  useEffect(() => {
    let b = addRandomTile(addRandomTile(board));
    setBoard(b);
  }, []);

  const handleMove = (dir: "up" | "down" | "left" | "right") => {
    if (gameOver) return;
    const newBoard = move(board, dir);
    if (JSON.stringify(newBoard) === JSON.stringify(board)) return;
    const addedScore = newBoard.flat().reduce((acc, val, idx) => {
      const prev = board.flat()[idx];
      if (val > prev) return acc + val;
      return acc;
    }, 0);
    setScore(score + addedScore);
    setBoard(newBoard);
    const has2048 = newBoard.flat().some(v => v === 2048);
    if (has2048) setWon(true);
    const empties = emptyPositions(newBoard);
    if (empties.length === 0 && !has2048) setGameOver(true);
    if (!gameOver) setBoard(addRandomTile(newBoard));
  };


  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      if (Math.max(absDeltaX, absDeltaY) < 30) return;
      if (absDeltaX > absDeltaY) {
        if (deltaX > 0) handleMove("right");
        else handleMove("left");
      } else {
        if (deltaY > 0) handleMove("down");
        else handleMove("up");
      }
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [board, gameOver, handleMove]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-4 gap-2">
        {board.flat().map((val, idx) => (
          <div
            key={idx}
            className={`w-16 h-16 flex items-center justify-center rounded-md text-xl font-bold ${
              val === 0
                ? "bg-muted"
                : val <= 4
                ? "bg-pink-200 text-pink-800"
                : val <= 8
                ? "bg-pink-300 text-pink-800"
                : val <= 16
                ? "bg-pink-400 text-pink-800"
                : "bg-pink-500 text-pink-800"
            }`}
          >
            {val !== 0 ? val : null}
          </div>
        ))}
      </div>
      <div className="text-lg">Score: {score}</div>
      {gameOver && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-xl font-bold">Game Over</div>
          <Share text={`I scored ${score} in 2048! ${url}`} />
        </div>
      )}
      {won && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-xl font-bold">You Win!</div>
          <Share text={`I scored ${score} in 2048! ${url}`} />
        </div>
      )}
    </div>
  );
}
