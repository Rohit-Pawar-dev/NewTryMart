const Notification = require("../../models/Notification");

exports.getUserNotifications = async (req, res) => {
  try {
    const { search = "", status, limit = 10, offset = 0 } = req.query;
    const userId = req.user.id;

    const filter = {
      user_id: userId,
      ...(status ? { status } : {}),
      title: { $regex: search, $options: "i" },
    };

    const total = await Notification.countDocuments(filter);

    const notifications = await Notification.find(filter)
      .sort({ created_at: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    // Extract IDs of the fetched notifications
    const notificationIds = notifications.map((n) => n._id);

    // Update their status to "read"
    await Notification.updateMany(
      { _id: { $in: notificationIds }, status: { $ne: "read" } },
      { $set: { status: "read" } }
    );

    return res.status(200).json({
      status: true,
      message: "User notifications fetched successfully",
      data: notifications,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Error fetching user notifications:", err);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.getUnreadNotificationCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const filter = {
      user_id: userId,
      status: "unread",
    };

    const total = await Notification.countDocuments(filter);

    return res.status(200).json({
      status: true,
      message: "Unread notification count fetched successfully",
      total,
    });
  } catch (err) {
    console.error("Error fetching unread notification count:", err);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};
