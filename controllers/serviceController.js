const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ServiceService = require('../services/serviceService');

class ServiceController {
  static getAllServices = asyncHandler(async (req, res) => {
    const result = await ServiceService.getAllServices();
    res.status(200).json(new ApiResponse(200, result));
  });

  static createService = asyncHandler(async (req, res) => {
    const io = req.app?.get('io');
    const result = await ServiceService.createService(req.body, io);
    res.status(201).json(new ApiResponse(201, result, 'Service created successfully'));
  });

  static updateService = asyncHandler(async (req, res) => {
    const io = req.app?.get('io');
    const result = await ServiceService.updateService(req.params.id, req.body, io);
    res.status(200).json(new ApiResponse(200, result, 'Service updated successfully'));
  });

  static uploadServiceImage = asyncHandler(async (req, res) => {
    const io = req.app?.get('io');
    const result = await ServiceService.uploadServiceImage(req.params.id, req.file, io);
    res.status(200).json(new ApiResponse(200, result, 'Service image uploaded successfully'));
  });

  static getServiceImage = asyncHandler(async (req, res) => {
    try {
      const result = await ServiceService.getServiceImage(req.params.id);
      res.set('Content-Type', result.image_mimetype);
      res.send(result.image);
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).send('Image not found');
      }
      throw error;
    }
  });

  static bookService = asyncHandler(async (req, res) => {
    const result = await ServiceService.bookService(req.user.role, req.user.id, req.body);
    res.status(201).json(new ApiResponse(201, result, 'Service booked successfully'));
  });

  static getMyBookings = asyncHandler(async (req, res) => {
    const result = await ServiceService.getMyBookings(req.user.role, req.user.id);
    res.status(200).json(new ApiResponse(200, result));
  });

  static getServiceSchedules = asyncHandler(async (req, res) => {
    const result = await ServiceService.getServiceSchedules(req.params.id);
    res.status(200).json(new ApiResponse(200, result));
  });

  static addServiceSchedule = asyncHandler(async (req, res) => {
    const result = await ServiceService.addServiceSchedule(req.params.id, req.body);
    res.status(201).json(new ApiResponse(201, result, 'Schedule added successfully'));
  });

  static deleteServiceSchedule = asyncHandler(async (req, res) => {
    const result = await ServiceService.deleteServiceSchedule(req.params.scheduleId);
    res.status(200).json(new ApiResponse(200, result, 'Schedule deleted successfully'));
  });

  static deleteService = asyncHandler(async (req, res) => {
    const io = req.app?.get('io');
    const result = await ServiceService.deleteService(req.params.id, io);
    res.status(200).json(new ApiResponse(200, result, 'Service removed completely.'));
  });
}

module.exports = ServiceController;
