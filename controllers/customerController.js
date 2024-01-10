const Customer = require("../models/Customer");
const Order = require("../models/Order");
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const Token = require("../models/tokenModel");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const Product = require("../models/Products");
const gstModel = require('../models/Gst');
const PriceUpdate = require("../models/PriceUpdate");
const Stock = require("../models/Stock")



const app = express();
app.use(cookieParser());

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// Customer's Registration & Create Customer
const registerCustomer = async (req, res) => {
  try {
    const { username, email, password, confirmPassword, phone, active } =
      req.body;
    console.log(req.body);

    // Check if password and confirmPassword match
    if (password !== confirmPassword) {
      return res.send({ success: false, msg: "Passwords do not match" });
    }
    const customer = await Customer.create({
      username: username,
      email: email,
      password: password,
      phone: phone,
      active: active,
    });
    return res.send({
      success: true,
      msg: "Customer added successfully",
      customer,
    });
  } catch (error) {
    return res.send({ error: error.message });
  }
};

// Customer's Login
const loginCustomer = async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body);

  // Validation
  if (!email || !password) {
    return res.send({ success: false, msg: "Please fill all required fields" });
  }

  try {
    // Check if the customer exists
    const customer = await Customer.findOne({ email });

    if (!customer) {
      return res.send({ success: false, msg: "Invalid Credentials" });
    }

    // Check if the password is correct
    const passwordIsCorrect = await bcrypt.compare(password, customer.password);

    if (passwordIsCorrect) {
      // Generate Token
      const token = generateToken(customer._id);

      // Fetch the customer's cart items
      // const CustomerId = customer._id;
      // console.log(CustomerId , 1);
      // const cart = await Cart.findById({ CustomerId});
      // console.log(cart);

      // Send HTTP-only cookie
      res.cookie("token", token, {
        path: "/",
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 86400), // 1 day
        sameSite: "none",
        secure: true,
      });

      return res.send({
        success: true,
        msg: "Successfully LoggedIn",
        token: token,
        customer: customer,
      });
    } else {
      return res.send({ success: false, msg: "Invalid user data" });
    }
  } catch (err) {
    // Handle any errors that might occur during await operations
    return res.send({ success: false, msg: "Server error" });
  }
};

// Customer's Logout
const logoutCustomer = async (req, res) => {
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0), // 1 day
    sameSite: "none",
    secure: true,
  });
  return res.send({
    message: "Successfully logged out",
  });
};

// Get All Customers
const getCustomers = async (req, res) => {
  const customers = await Customer.find({ deleted: false }).lean();
  if (customers) {
    res.send({ customers });
  } else {
    res.send({ success: false, msg: "User not found" });
  }
};


// Get LoggedIn Customer
const getLoggedInCustomer = async (req, res) => {
  let customerId = req.body.id;
  const customer = await Customer.findById(customerId);

  if (customer) {
    return res.send({
      success: true,
      customer,
    });
  } else {
    return res.send({ success: false, msg: "User not found" });
  }
};

// Get Specific Cutomer By Id
const getSpecificCustomer = async (req, res) => {
  try {
    let customerId = req.params.id;
    const customer = await Customer.findById(customerId);
    if (customer) {
      return res.send({
        success: true,
        customer,
      });
    } else {
      return res.send({ success: false, msg: "User not found" });
    }
  } catch (error) {
    // Handle any errors that might occur during the execution of the function
    return res.send({ success: false, msg: "Internal Server Error" });
  }
};

// Get LoggedIn Status
const loginStatus = async (req, res) => {
  const token = req.body.token;
  // console.log(token);
  if (!token) {
    return res.send({ success: false });
  }

  // Verify token
  const verified = jwt.verify(token, process.env.JWT_SECRET);
  if (verified) {
    return res.send({ success: true });
  } else {
    return res.send({ success: false });
  }
};

// Update Customer
const updateCustomer = async (req, res) => {
  try {
    const CustomerId = req.params.id;
    console.log(CustomerId);
    const { username } = req.body;
  
    const updateData = await Customer.findByIdAndUpdate(
      CustomerId,
    {
      username : username
    }
    );

    if (!updateData) {
      return res.send({
        success: false,
        message: "Customer not found",
      });
    }

    return res.send({
      success: true,
      message: "Customer updated successfully",
      customer: updateData,
    });
  } catch (error) {
    return res.send({ error: error.message });
  }
};

// Update Password
const updateCustomerPassword = async (req, res) => {
  try {
    const customerId = req.params.id;
    const customer = await Customer.findById(customerId);
    const { oldPassword, newPassword } = req.body;
    console.log(req.body);
    if (!customer) {
      return res.send({
        success: false,
        msg: "User not found , Please signup",
      });
    }
    // Validate
    if (!oldPassword || !newPassword) {
      return res.send({
        success: false,
        msg: "Please add old and new password",
      });
    }

    // check if old password matches password in DB
    const passwordMatches = await bcrypt.compare(
      oldPassword,
      customer.password
    );
    if (!passwordMatches) {
      return res.send({ success: false, msg: "Old password is incorrect" });
    }

    if (oldPassword === newPassword) {
      return res.send({
        success: false,
        msg: "New Password cannot be same as Old password",
      });
    } else {
      const secPass = await bcrypt.hash(newPassword, 10);
      await Customer.findByIdAndUpdate(customerId, {
        password: secPass,
      });
      return res.send({ success: true, msg: "Password changed successfully" });
    }
  } catch (error) {
    return res.send({ error: error.message });
  }
};

// Forget Password
const forgotCustomerPassword = async (req, res) => {
  let { email } = req.body;
  const customer = await Customer.findOne({ email });
  
  if (!customer) {
    res.send({ success: false, msg: "Customer not found" });
  }
  // Delete Token if it exist in DB
  await Token.findOneAndDelete({ customerId: customer._id });

  // Create Rest Token
  let resetToken = crypto.randomBytes(32).toString("hex") + customer._id;
  console.log(resetToken);

  // Hash token before saving to db
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // /Save token to DB
  await new Token({
    customerId: customer.id,
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * (60 * 1000), //30 Minutes
  }).save();

  // Construct Reset Url
  const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;
  console.log(resetUrl)

  // Reset Email
  const message = `
    <h2>Hello ${customer.username}</h2>
    <p>Please use this URL below to reset your password</p>
    <p>This reset link is valid for 30 Minutes</p>
  
  
    <a href=${resetUrl} clicktraking = off> ${resetUrl}</a>
  
    <p>Regards .... </p>
    `;
  const subject = "Password reset request";
  const send_to = customer.email;
  const sent_from = process.env.EMAIL_USER;

  try {
    await sendEmail(subject, message, send_to, sent_from);
    res.send({ success: true, msg: "Reset Email Sent" });
  } catch (error) {
    res.send(error);
  }
};

// Rset Customers Password
const resetCustomerPassword = async (req, res) => {
  const { password } = req.body;
  const { resetToken } = req.params;



  // Hash token then compare to Token in DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Find Token in DB
  const customerToken = await Token.findOne({
    token: hashedToken,
    expiresAt: { $gt: Date.now() },
  });

  console.log(customerToken);

  if (!customerToken) {
    return res.send("Invalid or Expired Token");
  }

  // Find User
  const customer = await Customer.findById(customerToken.customerId);

  if (!customer) {
    return res.send("Customer not found");
  }

  // Set the new password
  customer.password = password;
  
  try {
    // Save the updated customer document
    await customer.save();

    res.send({
      success: true,
      msg: "Password Reset Successful, Please Login",
    });
  } catch (error) {
    console.error("Error saving customer password:", error);
    res.status(500).send("Internal Server Error");
  }
};


// Delete Specific Customer
const DeleteCustomer = async (req, res, next) => {
  try {
    const customerId = req.body.id;
    const record = await Customer.findByIdAndDelete(
      customerId,
    );

    if (!record) {
      return res.send({ success: true, message: "record not found" });
    }

    return res.send({ success: true, message: "Successfully Deleted" });
  } catch (error) {
    return res.send({ success: false, error: error.message });
  }
};

// Add to Cart
const addToCart = async (req, res) => {
  const CustomerId = req.params.id;
  const { productId, quantity } = req.body;
  console.log(req.body);

  try {
    // Find the customer by ID and populate the cartItems field with product details
    const customer = await Customer.findById(CustomerId).populate(
      "cartItems.product"
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        msg: "Customer not found",
      });
    }

    // Check if the product already exists in the cart
    const existingCartItem = customer.cartItems.find(
      (item) => item.product._id.toString() === productId
    );

    if (existingCartItem) {
      existingCartItem.quantity += parseInt(quantity);
    } else {
      
      const product = await Product.findById(productId); 
      const GST = await gstModel.findById(product.gst); 

      if (!product) {
        return res.status(404).json({
          success: false,
          msg: "Product not found",
        });
      }

      customer.cartItems.push({
        product: product,
        quantity: parseInt(quantity),
        tax : GST.gst
      });
    }
    // Save the updated cart
    await customer.save();

    return res.send({
      success: true,
      msg: "Cart updated successfully",
      updatedCart: customer,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
};

// GetLoggedInCustomer's Cart Item
// const getLoggedInCustomerCartItems = async (req, res) => {
//   const customerId = req.params.id; 

//   try {
//     const customer = await Customer.findById(customerId).populate(
//       "cartItems.product"
//     );

//     if (!customer) {
//       return res.status(404).json({
//         success: false,
//         msg: "Customer not found",
//       });
//     }

    
//     const cartItems = customer.cartItems.map((item) => ({
//       product: item.product,
//       quantity: item.quantity,
//       tax:item.tax,
//       Stock : item.stock,
//     }));

//     return res.send({
//       success: true,
//       cartItems,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.send({
//       success: false,
//       msg: "Internal Server Error",
//     });
//   }
// };
const getLoggedInCustomerCartItems = async (req, res) => {
  const customerId = req.params.id; // Customer ID

  try {
    // Find the customer by ID and populate the cartItems field with product details
    const customer = await Customer.findById(customerId).populate(
      "cartItems.product"
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        msg: "Customer not found",
      });
    }

  
    const cartItems = await Promise.all(
      customer.cartItems.map(async (item) => {
      
        const stock = await Stock.findOne({ ProductId: item.product._id });

        return {
          product: item.product,
          quantity: item.quantity,
          tax: item.tax,
          stock: stock || null, 
        };
      })
    );

    return res.send({
      success: true,
      cartItems,
    });
  } catch (error) {
    console.error(error);
    return res.send({
      success: false,
      msg: "Internal Server Error",
    });
  }
};
// Remove a product from the customer's cart
const removeFromCart = async (req, res) => {
  const customerId = req.params.id; // Customer ID
  const { productId } = req.body; // Product ID
  // console.log(req.body);
  // console.log(req.params.id);

  try {
    // Find the customer by ID
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        msg: "Customer not found",
      });
    }

    // Check if the product exists in the cart
    const cartItemIndex = customer.cartItems.findIndex(
      (item) => item.product.toString() === productId
    );

    // if (cartItemIndex === -1) {
    //   return res.send({
    //     success: false,
    //     msg: "Product not found in the cart",
    //   });
    // }

    // Remove the product from the cart
    customer.cartItems.splice(cartItemIndex, 1);

    // Save the updated cart
    await customer.save();

    return res.send({
      success: true,
      msg: "Product removed from the cart successfully",
      updatedCart: customer,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
};

// Remove All Item From Cart
const removeAllFromCart = async (req, res) => {
  const customerId = req.params.id; // Customer ID

  try {
    // Find the customer by ID
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.send({
        success: false,
        msg: "Customer not found",
      });
    }

    // Remove all products from the cart
    customer.cartItems = [];

    // Save the updated cart
    await customer.save();

    res.send({
      success: true,
      msg: "All products removed from the cart successfully",
      updatedCart: customer,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
};

// UpdateCartItems
const updateCartItem = async (req, res) => {
  const customerId = req.params.id; // Customer ID
  const { cartItems } = req.body; // Product ID and updated quantity

  try {
    // Find the customer by ID
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        msg: "Customer not found",
      });
    }

    // Check if the product exists in the cart
    // const cartItem = customer.cartItems.find(
    //   (item) => item.product.toString() === productId
    // );

    // if (!cartItem) {
    //   return res.status(404).json({
    //     success: false,
    //     msg: 'Product not found in the cart',
    //   });
    // }

    // // Update the quantity of the product in the cart
    // cartItem.quantity = parseInt(updatedQuantity);

    // Save the updated cart
    const updatedCart = await Customer.findByIdAndUpdate(customerId, req.body);
    if (updatedCart) {
      const customer = await Customer.findById(customerId);

      return res.send({
        success: true,
        msg: "Quantity updated in the cart successfully",
        updatedCart: customer,
      });
    }
  } catch (error) {
    console.error(error);
    return res.send({
      success: false,
      msg: "Internal Server Error",
    });
  }
};

//Adding Products to wishlist
const addToWishlist = async (req, res) => {
  const customerId = req.params.id;
  const { productId } = req.body;

  try {
    // Find the customer by ID
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        msg: "Customer not found",
      });
    }

    // Check if the product already exists in the wishlist
    const existingWishlistItem = customer.wishlist.find(
      (item) => item.toString() === productId
    );

    if (!existingWishlistItem) {
      // If the product does not exist in the wishlist, add it
      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          msg: "Product not found",
        });
      }
      
      customer.wishlist.push(productId);
      await customer.save();

      return res.send({
        success: true,
        msg: "Product added to wishlist successfully",
        updatedCustomer: customer,
      });
    } else {
      // If the product already exists in the wishlist, return a message
      return res.send({
        success: false,
        msg: "Product is already in the wishlist",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
};

// Get LoggedIn customer Wishlist Item
const getLoggedInCustomerWishlistItems = async (req, res) => {
  const customerId = req.params.id; // Customer ID

  try {
    // Find the customer by ID and populate the cartItems field with product details
    const customer = await Customer.findById(customerId).populate(
      "wishlist"
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        msg: "Customer not found",
      });
    }

    // Extract relevant cart information with complete product details
    const wishlistItems = customer.wishlist.map((item) => ({
      product: item,
      // Add other product details if needed
    }));

    return res.send({
      success: true,
      wishlistItems,
    });
  } catch (error) {
    console.error(error);
    return res.send({
      success: false,
      msg: "Internal Server Error",
    });
  }
};

// Remove a product from the customer's wishlist
const removeFromWishlist = async (req, res) => {
  const customerId = req.params.id; // Customer ID
  const { productId } = req.body; // Product ID
  // console.log(req.body);
  // console.log(req.params.id);

  try {
    // Find the customer by ID
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        msg: "Customer not found",
      });
    }

    // Check if the product exists in the cart
    const wishlistItemIndex = customer.wishlist.findIndex(
      (item) => item.toString() === productId
    );

    // if (cartItemIndex === -1) {
    //   return res.send({
    //     success: false,
    //     msg: "Product not found in the cart",
    //   });
    // }

    // Remove the product from the cart
    customer.wishlist.splice(wishlistItemIndex, 1);

    // Save the updated cart
    await customer.save();

    return res.send({
      success: true,
      msg: "Product removed from the cart successfully",
      updatedCart: customer,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
};

// Get orderHistory of customer  by Customer's Id
const getOrderHistorybyCustomerId = async (req, res) => {
  try {
    const customerId = req.params.id;
    const customer = await Customer.findById(customerId).populate('orderHistory'); 

    if (!customer) {
      return res.send({ message: 'Customer not found' });
    }

    const orderHistory = customer.orderHistory; 

    res.send({success:true, orderHistory:orderHistory});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


const getCustomerReportByDateRange = async (req, res) => {
  try {
    
    const { startDate, endDate } = req.query;

    // Ensure that startDate and endDate are valid date strings in the "DD/MM/YYYY" format
    const datePattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    
    if (!datePattern.test(startDate) || !datePattern.test(endDate)) {
      return res.status(400).json({ success: false, msg: "Please provide valid date range in the 'DD/MM/YYYY' format." });
    }

 
    const [,  startMonth, startDay ,startYear] = startDate.match(datePattern);
    const [,  endMonth, endDay,endYear] = endDate.match(datePattern);

  
    const start = new Date(`${startYear}-${startMonth}-${startDay}`);
    const end = new Date(`${endYear}-${endMonth}-${endDay}`);

    
    const customers = await Customer.find({
      createdAt: {
        $gte: start, 
        $lte: end,   
      },
    });

    return res.status(200).json({
      success: true,
      msg: "Customer report generated successfully",
      customers,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};




module.exports = {
  registerCustomer,
  loginCustomer,
  logoutCustomer,
  getCustomers,
  getLoggedInCustomer,
  getSpecificCustomer,
  loginStatus,
  updateCustomerPassword,
  forgotCustomerPassword,
  resetCustomerPassword,
  updateCustomer,
  DeleteCustomer,
  addToCart,
  removeFromCart,
  getLoggedInCustomerCartItems,
  removeAllFromCart,
  updateCartItem,
  addToWishlist,
  getLoggedInCustomerWishlistItems,
  removeFromWishlist,
  getOrderHistorybyCustomerId,
  getCustomerReportByDateRange
};
