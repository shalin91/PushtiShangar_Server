const Order = require("../models/Order");
const Customer = require("../models/Customer");
const Product = require("../models/Products");
const GST = require("../models/Gst");
const Stock = require("../models/Stock");
const lattestInvoiceModel = require("../models/lattestInvoice");
const Category = require('../models/ProductCat');


exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().lean();
    
    return res.send({ orders });
  } catch (error) {
    return res.send({ error: error.message });
  }
};



exports.createOrder = async (req, res, next) => {
  const {
    customer,
    FirstName,
    LastName,
    products,
    status,
    totalAmount,
    country,
    state,
    city,
    postCode,
    shippingAddress,
    paymentMethod,
    couponCode,
    giftVoucher,
  } = req.body;

  try {
    products.forEach((element) => {
      Stock.find({
        $and: [
          { ProductId: element.product },
          { quantity: { $gt: 0 } }
        ]
      }).then((filteredStock) => {
        const itemWithOldestDate = filteredStock.reduce(
          (oldestItem, currentItem) => {
            if (
              !oldestItem ||
              currentItem.date.getTime() < oldestItem.date.getTime()
            ) {
              return currentItem;
            }
            return oldestItem;
          },
          null
        );
      
        const updatedQuantity = itemWithOldestDate.quantity - element.quantity;
        Stock.findByIdAndUpdate(itemWithOldestDate._id, {
          quantity: updatedQuantity,
        }).then((filteredStock) => {

         
        });
      });
    });

    const updatedInvoice = await lattestInvoiceModel.findByIdAndUpdate(
      { _id: "652f8866c509652ac19e0e8b" }, 
      { $inc: { lattestInvoice: 1 } }, 
      { new: true }
    );

    console.log(updatedInvoice.lattestInvoice)

    const newOrder = await Order.create({
      customer: customer,
      FirstName: FirstName,
      LastName: LastName,
      products: products,
      status: status,
      totalAmount: totalAmount,
      country: country,
      state: state,
      city: city,
      postCode: postCode,
      shippingAddress: shippingAddress,
      paymentMethod: paymentMethod,
      couponCode: couponCode,
      isInvoiceGenrated:updatedInvoice?true:false,
      invoiceNumber:updatedInvoice.lattestInvoice,
      invoiceGenrationDate: new Date()
      // giftVoucher: giftVoucher,
    });
    
    const customerDoc = await Customer.findById(customer);
    if (customerDoc) {
      customerDoc.orderHistory.push(newOrder._id);
      await customerDoc.save();
    }

    return res.send({
      success: true,
      message: "Order created successfully",
      order: newOrder,
    });
  } catch (error) {
    return res.send({ success: false, error: error.message });
  }
};

// Make sure to use the correct path to your Product model

exports.getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Fetch details of each product in the order
    const products = await Promise.all(
      order.products.map(async (product) => {
        const productDetails = await Product.findById(product.product);
        const gstDetails = await GST.findById(productDetails.gst);

        // You can include other details if needed
        return {
          product: {
            ...productDetails._doc,
            gst: gstDetails ? gstDetails.gst : null,
          },
          quantity: product.quantity,
          // Include other details if needed
        };
      })
    );

    // Combine the order details with product details
    const orderWithProductDetails = {
      order,
      products,
    };

    return res.send({ success: true, orderWithProductDetails });
  } catch (error) {
    return res.send({ error: error.message });
  }
};

exports.updateOrder = async (req, res, next) => {
  const orderId = req.params.id;
  const updateData = {
    status: req.body.status,
    updatedAt: Date.now(),
  };

  try {
    const updatedOrder = await Order.findByIdAndUpdate(orderId, updateData, {
      new: true,
    });

    if (!updatedOrder) {
      return res.send({ error: "Order not found" });
    }

    return res.send({
      success: true,
      message: "Order updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    return res.send({ success: false, error: error.message });
  }
};

exports.deleteOrder = async (req, res, next) => {
  const orderId = req.params.id;

  try {
    const deletedOrder = await Order.findByIdAndRemove(orderId);

    if (!deletedOrder) {
      return res.send({ error: "Order not found" });
    }

    return res.send({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    return res.send({ success: false, error: error.message });
  }
};

exports.getHighValueCustomers = async (req, res, next) => {
  try {
    const highValueCustomers = await Order.aggregate([
      {
        $group: {
          _id: "$customer",
          totalShoppingAmount: { $sum: "$totalAmount" },
        },
      },
      {
        $match: { totalShoppingAmount: { $gt: 50000 } },
      },
      {
        $lookup: {
          from: "customers", // Replace with the actual name of your Customers collection
          localField: "_id",
          foreignField: "_id",
          as: "customerData",
        },
      },
      {
        $unwind: "$customerData",
      },
      {
        $project: {
          customerData: 1,
          totalShoppingAmount: 1,
        },
      },
    ]);

    return res.send({success:true, highValueCustomers: highValueCustomers });
  } catch (error) {
    return res.send({ error: error.message });
  }
};

exports.getMedValueCustomers = async (req, res, next) => {
  try {
    const highValueCustomers = await Order.aggregate([
      {
        $group: {
          _id: "$customer",
          totalShoppingAmount: { $sum: "$totalAmount" },
        },
      },
      {
        $match: {
          totalShoppingAmount: {
            $gte: 15000, // Greater than or equal to 15,000
            $lte: 40000, // Less than or equal to 40,000
          },
        },
      },
      {
        $lookup: {
          from: "customers", // Replace with the actual name of your Customers collection
          localField: "_id",
          foreignField: "_id",
          as: "customerData",
        },
      },
      {
        $unwind: "$customerData",
      },
      {
        $project: {
          customerData: 1,
          totalShoppingAmount: 1,
        },
      },
    ]);

    return res.send({ success: true,  highValueCustomers: highValueCustomers });
  } catch (error) {
    return res.send({ error: error.message });
  }
};


exports.getTopSellingProducts = async (req, res, next) => {
  try {
    const topSellingProducts = await Order.aggregate([
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.product",
          totalQuantityOrdered: { $sum: "$products.quantity" },
        },
      },
      {
        $sort: { totalQuantityOrdered: -1 },
      },
    ]);

    // Fetch product details for each top-selling product
    const topSellingProductDetails = await Promise.all(
      topSellingProducts.map(async (product) => {
        const productDetails = await Product.findById(product._id);
        return {
          product: productDetails,
          totalQuantityOrdered: product.totalQuantityOrdered,
        };
      })
    );

    return res.send({ success: true, topSellingProducts: topSellingProductDetails });
  } catch (error) {
    return res.send({ success: false, error: error.message });
  }
};


// exports.getStockReportByProduct = async (req, res, next) => {
//   try {
//     // Fetch all products and their corresponding stock quantities
//     const stockReport = await Product.aggregate([
//       {
//         $lookup: {
//           from: "stocks", // Replace with your Stock collection name
//           localField: "_id",
//           foreignField: "product",
//           as: "stockData",
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           product: "$name", // Use the name or another product property
//           stockQuantity: { $sum: "$stockData.quantity" },
//         },
//       },
//     ]);

//     return res.send({ success: true, stockReport });
//   } catch (error) {
//     return res.send({ success: false, error: error.message });
//   }
// };





