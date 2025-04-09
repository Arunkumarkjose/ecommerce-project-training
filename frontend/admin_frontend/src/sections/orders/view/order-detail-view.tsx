import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "src/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Avatar,
  Button,
  Grid,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { Home, ShoppingCart, ArrowBack, AttachMoney } from "@mui/icons-material";

const OrderDetailPage: React.FC = () => {
  const { orderID } = useParams<{ orderID: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  // State for rejection reason dialog
  const [rejectionReason, setRejectionReason] = useState("");
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderID]);

  // Fetch order details from API
  const fetchOrderDetails = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8000/admin-view-order/${orderID}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrder(response.data);
      console.log("Order details fetched:", response.data);
      
    } catch (error) {
      console.error("Failed to fetch order details:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle return actions (approve, reject, picked_up, refunded)
  const handleReturnAction = async (action: "approved" | "rejected" | "picked_up" | "refunded" | "delivered" | "shipped", reason?: string) => {
    try {
      await axios.post(
        "http://localhost:8000/update-returns",
        { orderID, status: action, rejection_reason: reason || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ Refresh order data after action
      fetchOrderDetails();
    } catch (error) {
      console.error(`Failed to ${action} return request:`, error);
    }
  };

  const handleOrderAction = async (action:  "delivered" | "shipped", reason?: string) => {
    try {
      await axios.put(
        `http://localhost:8000/update-order-status/${orderID}`,
        {  status: action },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ Refresh order data after action
      fetchOrderDetails();
    } catch (error) {
      console.error(`Failed to ${action} return request:`, error);
    }
  };

  if (loading) return <p>Loading order details...</p>;
  if (!order) return <p>Order not found.</p>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back to Orders */}
      <Button
        component={Link}
        to="/admin/orders"
        variant="contained"
        color="primary"
        startIcon={<ArrowBack />}
        sx={{ mb: 4 }}
      >
        Back to Orders
      </Button>

      {/* Order Summary */}
      <Card sx={{ mb: 6, boxShadow: 3, p: 2 }}>
        <CardHeader
          title={`Order #${order.orderID}`}
          subheader={`Placed on ${new Date(order.created_at).toLocaleDateString()}`}
        />
        <CardContent>
          <Typography variant="h6" color="primary" gutterBottom>
            Status: {order.status.toUpperCase()}
          </Typography>
          <Typography variant="body1">
            Total Price: <strong>${order.total_price.toFixed(2)}</strong>
          </Typography>
          <Typography variant="h6" color="secondary" gutterBottom>
           Payment Status: {order.payment_status.toUpperCase()}
          </Typography>
        </CardContent>
      </Card>

      {/* Return Actions Based on Order Status */}
      {order.status === "return_requested" && (
        <Card sx={{ boxShadow: 3, mb: 8, p: 2, backgroundColor: "#fff9c4" }}>
          <CardHeader title="Return Request Details" />
          <CardContent>
            <Typography><strong>Reason:</strong> {order.return_details.reason}</Typography>
            <Typography><strong>Requested On:</strong> {new Date(order.return_details.requested_at).toLocaleDateString()}</Typography>
            <Typography><strong>Pickup Address:</strong> {order.return_details.pickup_address}</Typography>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  onClick={() => handleReturnAction("approved")}
                >
                  Approve Return
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  variant="contained"
                  color="error"
                  fullWidth
                  onClick={() => setOpenDialog(true)}
                >
                  Reject Return
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Mark as Picked Up */}
      {order.status === "return_approved" && (
        <Card sx={{ boxShadow: 3, mb: 8, p: 2, backgroundColor: "#e0f7fa" }}>
          <CardHeader title="Return Approved" />
          <CardContent>
            <Typography>
              The return request has been approved. Please mark the return as picked up once collected.
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => handleReturnAction("picked_up")}
            >
              Mark as Picked Up
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Initiate Refund */}
      {order.status === "picked_up" && (
        <Card sx={{ boxShadow: 3, mb: 8, p: 2, backgroundColor: "#fbe9e7" }}>
          <CardHeader title="Refund Process" avatar={<AttachMoney />} />
          <CardContent>
            <Typography>
              The returned item has been picked up. Admin can now initiate the refund process.
            </Typography>
            <Typography>
              <strong>Refund Amount:</strong> ${order.total_price.toFixed(2)}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Button
              variant="contained"
              color="success"
              fullWidth
              onClick={() => handleReturnAction("refunded")}
            >
              Initiate Refund
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reject Return Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Reject Return Request</DialogTitle>
        <DialogContent>
          <FormControl fullWidth>
            <InputLabel>Rejection Reason</InputLabel>
            <Select value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}>
              <MenuItem value="Damaged product">Damaged product</MenuItem>
              <MenuItem value="Used product">Used product</MenuItem>
              <MenuItem value="Return period expired">Return period expired</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="secondary">Cancel</Button>
          <Button
            variant="contained"
            color="error"
            disabled={!rejectionReason}
            onClick={() => {
              handleReturnAction("rejected", rejectionReason);
              setOpenDialog(false);
            }}
          >
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>


      {order.status === "confirmed" && (
        <Card sx={{ boxShadow: 3, mb: 8, p: 2, backgroundColor: "#fbe9e7" }}>
          
          <CardContent>

            <Divider sx={{ my: 2 }} />

            <Button
              variant="contained"
              color="success"
              fullWidth
              onClick={() => handleOrderAction("shipped")}
            >
              Mark as shipped
            </Button>
          </CardContent>
        </Card>
      )}
      {order.status === "shipped" && (
        <Card sx={{ boxShadow: 3, mb: 8, p: 2, backgroundColor: "#fbe9e7" }}>
          
          <CardContent>

            <Divider sx={{ my: 2 }} />

            <Button
              variant="contained"
              color="success"
              fullWidth
              onClick={() => handleOrderAction("delivered")}
            >
              Mark as delivered
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Customer & Delivery Details */}
            <Grid container spacing={4} sx={{ mb: 8 }}>
              <Grid item xs={12} md={6}>
                <Card sx={{ boxShadow: 2, p: 2 }}>
                  <CardHeader avatar={<Avatar>{order.customer_name.charAt(0)}</Avatar>} title="Customer Details" />
                  <CardContent>
                    <Typography><strong>Name:</strong> {order.customer_name}</Typography>
                    <Typography><strong>Email:</strong> {order.customerEmail}</Typography>
                    <Typography><strong>Phone:</strong> {order.customerPhone}</Typography>
                  </CardContent>
                </Card>
              </Grid>
      
              <Grid item xs={12} md={6}>
                <Card sx={{ boxShadow: 2, p: 2 }}>
                  <CardHeader avatar={<Home />} title="Delivery Address" />
                  <CardContent>
                    <Typography>{order.delivery_address}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            {/* Ordered Products */}
                  <Card sx={{ boxShadow: 3, mb: 2, p: 1 }}>
                    <CardHeader avatar={<ShoppingCart />} title="Ordered Products" />
                    <CardContent>
                      {order.products.length > 0 ? (
                        <Grid container spacing={3}>
                          {order.products.map((product: any) => (
                            <Grid item xs={4} key={product.id}>
                              
                              <Paper elevation={3} sx={{ display: "flex", alignItems: "center", padding: 2, borderRadius: 2, gap: 3 }}>
                              <div>
                              <Typography variant="h6">{product.name}</Typography>
                                <img src={`http://localhost:8000${product.image}?t=${new Date().getTime()}`} alt={product.name} className="h-20 w-20 object-cover rounded-md" />
                                </div>
                                {/* Display selected options */}
                                <div>
                              {product.selected_options && (
                <ul className="mt-1 text-sm text-gray-500">
                  {Object.entries(product.selected_options).map(([key, value]) => (
                    <li key={key}>
                      <span className="font-medium">{key}:</span> {String(value)}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-lg font-medium text-gray-900">
              ${(product.price * product.quantity).toFixed(2)}
            </p>
            <div className="mt-4">
            <p className="text-sm text-gray-500">Quantity: {product.quantity}</p>
          </div>
          </div>
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Typography>No products found for this order.</Typography>
                      )}
                    </CardContent>
                  </Card>
                  
    </div>
  );
};

export default OrderDetailPage;
