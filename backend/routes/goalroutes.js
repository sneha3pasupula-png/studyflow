import express from "express";
import Goal from "../models/goal.js";

const router = express.Router();

// GET: All study goals
router.get("/", async (req, res) => {
  try {
    const goals = await Goal.find().sort({ createdAt: -1 });
    res.status(200).json(goals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST: Create a new goal
router.post("/", async (req, res) => {
  try {
    const {
      title,
      subject,
      priority,
      type,
      target,
      progress,
      completed,
      dueDate,
    } = req.body;

    if (!title || !subject) {
      return res.status(400).json({
        message: "Title and subject are required",
      });
    }

    const newGoal = await Goal.create({
      title,
      subject,
      priority,
      type,
      target,
      progress,
      completed,
      dueDate: dueDate || null,
    });

    res.status(201).json(newGoal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT: Update a goal
router.put("/:id", async (req, res) => {
  try {
    const updatedGoal = await Goal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedGoal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    res.status(200).json(updatedGoal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE: Delete a goal
router.delete("/:id", async (req, res) => {
  try {
    const deletedGoal = await Goal.findByIdAndDelete(req.params.id);

    if (!deletedGoal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    res.status(200).json({ message: "Goal deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;