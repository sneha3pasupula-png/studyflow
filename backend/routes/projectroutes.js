import express from "express";
import mongoose from "mongoose";
import Project from "../models/project.js";

const router = express.Router();
const projectFields = ["name", "description", "subject", "startDate", "dueDate", "status"];

function validateId(id, res) {
  if (mongoose.isValidObjectId(id)) return true;
  res.status(400).json({ message: "Invalid project ID." });
  return false;
}

function pickProjectFields(body) {
  const input = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  return Object.fromEntries(
    projectFields
      .filter(field => Object.hasOwn(input, field))
      .map(field => [field, input[field]]),
  );
}

router.get("/", async (req, res) => {
  try {
    const projects = await Project.find().sort({ updatedAt: -1 });
    res.status(200).json(projects);
  } catch (error) {
    console.error("Unable to load projects:", error);
    res.status(500).json({ message: "Unable to load projects." });
  }
});

router.post("/", async (req, res) => {
  try {
    const project = await Project.create(pickProjectFields(req.body));
    res.status(201).json(project);
  } catch (error) {
    const isValidationError = error.name === "ValidationError";
    if (!isValidationError) console.error("Unable to create project:", error);
    res.status(isValidationError ? 400 : 500).json({
      message: isValidationError ? error.message : "Unable to create project.",
    });
  }
});

router.put("/:id", async (req, res) => {
  if (!validateId(req.params.id, res)) return;

  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      pickProjectFields(req.body),
      { new: true, runValidators: true },
    );
    if (!project) return res.status(404).json({ message: "Project not found." });
    res.status(200).json(project);
  } catch (error) {
    const isValidationError = error.name === "ValidationError" || error.name === "CastError";
    if (!isValidationError) console.error("Unable to update project:", error);
    res.status(isValidationError ? 400 : 500).json({
      message: isValidationError ? error.message : "Unable to update project.",
    });
  }
});

router.delete("/:id", async (req, res) => {
  if (!validateId(req.params.id, res)) return;

  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found." });
    res.status(200).json({ message: "Project deleted." });
  } catch (error) {
    console.error("Unable to delete project:", error);
    res.status(500).json({ message: "Unable to delete project." });
  }
});

export default router;
