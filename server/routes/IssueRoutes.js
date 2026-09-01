const express = require("express");
const Issue = require("../models/Issue");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE A NEW CIVIC ISSUE
router.post("/", protect, async (req, res) => {
  try {
    const { title, description, category, location } = req.body;

    // Check required fields
    if (!title || !description || !category || !location) {
      return res.status(400).json({
        message: "Please provide title, description, category and location",
      });
    }

    // Create issue
    const issue = await Issue.create({
      title,
      description,
      category,
      location,
      reportedBy: req.user._id,
    });

    res.status(201).json({
      message: "Issue reported successfully",
      issue,
    });
  } catch (error) {
    console.error("Create Issue Error:", error);

    res.status(500).json({
      message: "Failed to create issue",
      error: error.message,
    });
  }
});

// GET ALL CIVIC ISSUES
router.get("/", protect, async (req, res) => {
  try {
    const issues = await Issue.find()
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: issues.length,
      issues,
    });
  } catch (error) {
    console.error("Get Issues Error:", error);

    res.status(500).json({
      message: "Failed to fetch issues",
      error: error.message,
    });
  }
});

// GET SINGLE ISSUE
router.get("/:id", protect, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate("reportedBy", "name email");

    if (!issue) {
      return res.status(404).json({
        message: "Issue not found",
      });
    }

    res.status(200).json({
      issue,
    });
  } catch (error) {
    console.error("Get Single Issue Error:", error);

    res.status(500).json({
      message: "Failed to fetch issue",
      error: error.message,
    });
  }
});

// UPDATE ISSUE STATUS
router.put("/:id", protect, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        message: "Please provide a status",
      });
    }

    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!issue) {
      return res.status(404).json({
        message: "Issue not found",
      });
    }

    res.status(200).json({
      message: "Issue updated successfully",
      issue,
    });
  } catch (error) {
    console.error("Update Issue Error:", error);

    res.status(500).json({
      message: "Failed to update issue",
      error: error.message,
    });
  }
});

// DELETE ISSUE
router.delete("/:id", protect, async (req, res) => {
  try {
    const issue = await Issue.findByIdAndDelete(req.params.id);

    if (!issue) {
      return res.status(404).json({
        message: "Issue not found",
      });
    }

    res.status(200).json({
      message: "Issue deleted successfully",
    });
  } catch (error) {
    console.error("Delete Issue Error:", error);

    res.status(500).json({
      message: "Failed to delete issue",
      error: error.message,
    });
  }
});

module.exports = router;