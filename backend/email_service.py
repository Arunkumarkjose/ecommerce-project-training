from pydantic import BaseModel
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
import os
from dotenv import load_dotenv
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from typing import List, Optional

load_dotenv()

class EmailSchema(BaseModel):
    email: str
    subject: str
    body: str

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),  # Use App Password, NOT your real email password
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=int(os.getenv("MAIL_PORT")),
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_STARTTLS=os.getenv("MAIL_STARTTLS") == "True",
    MAIL_SSL_TLS=os.getenv("MAIL_SSL_TLS") == "True",
    USE_CREDENTIALS=True
)


fast_mail = FastMail(conf)

async def send_email(email: EmailSchema, attachment_path: Optional[str] = None):
    message = MessageSchema(
        subject=email.subject,
        recipients=[email.email],  
        body=email.body,
        subtype=MessageType.html  ,
        attachments=[attachment_path] if attachment_path else []
    )


  
    fast_mail = FastMail(conf)

    try:
        await fast_mail.send_message(message)
        print(f"✅ Email successfully sent to {email.email}")
        return {"status": "success", "message": f"Email sent to {email.email}"}

    except Exception as e:
        print(f"❌ Failed to send email to {email.email}: {e}") 
        return {"status": "failed", "message": str(e)}


def generate_invoice(order_details):
    invoice_path = f"invoices/invoice_{order_details['orderID']}.pdf"
    os.makedirs("invoices", exist_ok=True)

    c = canvas.Canvas(invoice_path, pagesize=letter)
    width, height = letter

    c.setFont("Helvetica-Bold", 16)
    c.drawString(200, height - 50, "Invoice")

    # Customer Details
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 100, f"Customer: {order_details['customer_name']}")
    c.drawString(50, height - 120, f"Email: {order_details['customerEmail']}")
    c.drawString(50, height - 140, f"Phone: {order_details['customerPhone']}")
    c.drawString(50, height - 160, f"Address: {order_details['delivery_address']}")

    # Table Header
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 200, "Product")
    c.drawString(250, height - 200, "Quantity")
    c.drawString(350, height - 200, "Price")
    c.drawString(450, height - 200, "Total")

    y_position = height - 220
    c.setFont("Helvetica", 12)

    for product in order_details["products"]:
        c.drawString(50, y_position, product["name"])
        c.drawString(250, y_position, str(product["quantity"]))
        c.drawString(350, y_position, f"${product['price']:.2f}")
        c.drawString(450, y_position, f"${product['quantity'] * product['price']:.2f}")
        y_position -= 20

    y_position -= 30
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y_position, f"Total Price: ${order_details['total_price']:.2f}")

    c.save()
    return invoice_path

async def send_reset_email(email: str, reset_token: str):
    reset_url = f"http://localhost:3039/reset-password/{reset_token}"  # React frontend URL
    message = MessageSchema(
        subject="Password Reset",
        recipients=[email],  
        body=f"\nClick the link to reset your password: {reset_url}",
        subtype=MessageType.html  ,
    )
    fast_mail = FastMail(conf)

    try:
        await fast_mail.send_message(message)
        print(f"✅ Email successfully sent to {email}")
        return {"status": "success", "message": f"Email sent to {email}"}
    except Exception as e:
        print(f"❌ Failed to send email to {email}: {e}") 
        return {"status": "failed", "message": str(e)}
