const Note = require("../models/Notes");
const mongoose = require("mongoose");

/**
 * GET /
 * Dashboard
 */
exports.dashboard = async (req, res) => {

  let perPage = 12;
  let page = req.query.page || 1;

  const locals = {
    title: "Dashboard",
    description: "Free NodeJS Notes App.",
  };

  try {
    // Mongoose "^7.0.0 Update
    const notes = await Note.aggregate([
      { $sort: { updatedAt: -1 } },
      { $match: { user: mongoose.Types.ObjectId(req.user.id) } },
      {
        $project: {
          title: { $substr: ["$title", 0, 30] },
          body: { $substr: ["$body", 0, 100] },
          createdAt: 1,
        },
      }
    ])
    .skip(perPage * page - perPage)
    .limit(perPage)
    .exec(); 

    const count = await Note.count();

    res.render('dashboard/index', {
      userName: req.user.lastName+" "+req.user.firstName,
      locals,
      notes,
      layout: "../views/layouts/dashboard",
      current: page,
      pages: Math.ceil(count / perPage)
    });
 
    // Original Code
    // Note.aggregate([
    //   { $sort: { updatedAt: -1 } },
    //   { $match: { user: mongoose.Types.ObjectId(req.user.id) } },
    //   {
    //     $project: {
    //       title: { $substr: ["$title", 0, 30] },
    //       body: { $substr: ["$body", 0, 100] },
    //     },
    //   },
    // ])
    //   .skip(perPage * page - perPage)
    //   .limit(perPage)
    //   .exec(function (err, notes) {
    //     Note.count().exec(function (err, count) {
    //       if (err) return next(err);
    //       res.render("dashboard/index", {
    //         userName: req.user.firstName,
    //         locals,
    //         notes,
    //         layout: "../views/layouts/dashboard",
    //         current: page,
    //         pages: Math.ceil(count / perPage),
    //       });
    //     });
    //   });

  } catch (error) {
    console.log(error);
  }
};

/**
 * GET /
 * View Specific Note
 */
exports.dashboardViewNote = async (req, res) => {
  const note = await Note.findById({ _id: req.params.id })
    .where({ user: req.user.id })
    .lean();

  if (note) {
    res.render("dashboard/view-note", {
      noteID: req.params.id,
      note,
      layout: "../views/layouts/dashboard",
    });
  } else {
    res.send("Something went wrong.");
  }
};

/**
 * PUT /
 * Update Specific Note
 */
exports.dashboardUpdateNote = async (req, res) => {
  try {
    const updateData = {
      title: req.body.title,
      body: req.body.body,
      updatedAt: Date.now(),
    };

    if (req.body.rememberDate) {
      updateData.rememberDate = new Date(req.body.rememberDate);
    } else {
      updateData.rememberDate = null;
    }

    // Update the note in the database
    await Note.findOneAndUpdate(
      { _id: req.params.id },
      updateData
    ).where({ user: req.user.id });

    // Emit an event to notify all clients
    io.emit('noteUpdated', { message: 'Note updated successfully!', type: 'info' });
    console.log('Event emitted: noteUpdated');
    res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
  }
};

/**
 * DELETE /
 * Delete Note
 */
exports.dashboardDeleteNote = async (req, res) => {
  try {
    // Delete the note from the database
    await Note.deleteOne({ _id: req.params.id }).where({ user: req.user.id });
    console.log('Event emitted: noteDeleted');
    // Emit an event to notify all clients
    io.emit('noteDeleted', { message: 'Note deleted successfully!', type: 'warning' });

    res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
  }
};


/**
 * GET /
 * Add Notes
 */
exports.dashboardAddNote = async (req, res) => {
  res.render("dashboard/add", {
    layout: "../views/layouts/dashboard",
  });
};

/**
 * POST /
 * Add Notes
 */
exports.dashboardAddNoteSubmit = async (req, res) => {
  try {
    req.body.user = req.user.id;
    req.body.createdAt = new Date(); 

    if (req.body.rememberDate) {
      req.body.rememberDate = new Date(req.body.rememberDate);
    } else {
      req.body.rememberDate = null;
    }

    // Create the note in the database
    await Note.create(req.body);

    // Emit an event to notify all clients
    io.emit('noteCreated', { message: 'Note created successfully!', type: 'success' });
    console.log('Event emitted: noteCreated');
    res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
  }
};

/**
 * GET /
 * Search
 */
exports.dashboardSearch = async (req, res) => {
  try {
    res.render("dashboard/search", {
      searchResults: "",
      layout: "../views/layouts/dashboard",
    });
  } catch (error) {}
};

/**
 * POST /
 * Search For Notes
 */
exports.dashboardSearchSubmit = async (req, res) => {
  try {
    let searchTerm = req.body.searchTerm;
    const searchNoSpecialChars = searchTerm.replace(/[^a-zA-Z0-9 ]/g, "");

    const searchResults = await Note.find({
      $or: [
        { title: { $regex: new RegExp(searchNoSpecialChars, "i") } },
        { body: { $regex: new RegExp(searchNoSpecialChars, "i") } },
      ],
    }).where({ user: req.user.id });

    res.render("dashboard/search", {
      searchResults,
      layout: "../views/layouts/dashboard",
    });
  } catch (error) {
    console.log(error);
  }
};
