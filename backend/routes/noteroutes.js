import express from "express";
import mongoose from "mongoose";
import Note from "../models/note.js";

const router = express.Router();
const noteFields = ["title", "subject", "description"];

function validateId(id, res) {
  if (mongoose.isValidObjectId(id)) return true;
  res.status(400).json({ message: "Invalid note ID." });
  return false;
}

function pickNoteFields(body) {
  const input = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  return Object.fromEntries(
    noteFields
      .filter(field => Object.hasOwn(input, field))
      .map(field => [field, input[field]]),
  );
}

router.get("/", async (req, res) => {
  try {
    const notes = await Note.find().sort({ updatedAt: -1 });
    res.status(200).json(notes);
  } catch (error) {
    console.error("Unable to load notes:", error);
    res.status(500).json({ message: "Unable to load notes." });
  }
});

router.post("/", async (req, res) => {
  try {
    const note = await Note.create(pickNoteFields(req.body));
    res.status(201).json(note);
  } catch (error) {
    const isValidationError = error.name === "ValidationError";
    if (!isValidationError) console.error("Unable to create note:", error);
    res.status(isValidationError ? 400 : 500).json({
      message: isValidationError ? error.message : "Unable to create note.",
    });
  }
});

router.put("/:id", async (req, res) => {
  if (!validateId(req.params.id, res)) return;

  try {
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      pickNoteFields(req.body),
      { new: true, runValidators: true },
    );
    if (!note) return res.status(404).json({ message: "Note not found." });
    res.status(200).json(note);
  } catch (error) {
    const isValidationError = error.name === "ValidationError" || error.name === "CastError";
    if (!isValidationError) console.error("Unable to update note:", error);
    res.status(isValidationError ? 400 : 500).json({
      message: isValidationError ? error.message : "Unable to update note.",
    });
  }
});

router.delete("/:id", async (req, res) => {
  if (!validateId(req.params.id, res)) return;

  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found." });
    res.status(200).json({ message: "Note deleted." });
  } catch (error) {
    console.error("Unable to delete note:", error);
    res.status(500).json({ message: "Unable to delete note." });
  }
});

export default router;
