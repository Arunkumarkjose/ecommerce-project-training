from fastapi import FastAPI, Depends, HTTPException, status, Query, UploadFile, File, Form,BackgroundTasks
from email_service import send_email, EmailSchema,generate_invoice, send_reset_email
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from sqlmodel import SQLModel, Session, create_engine, select, Field  
import jwt
import datetime
from datetime import timedelta
from pydantic import BaseModel, EmailStr
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import urllib.parse
from sqlalchemy import Column, TIMESTAMP, text,PrimaryKeyConstraint
from fastapi.staticfiles import StaticFiles
from sqlalchemy import TIMESTAMP, DECIMAL, Enum,desc
from typing import Literal
import os
import secrets
from fastapi.encoders import jsonable_encoder



# FastAPI App
app = FastAPI()


# CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3039","http://localhost:5173"],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Connection
username = "root"
password = "yatnam@456"
database = "ecommerce"
host = "localhost"

encoded_password = urllib.parse.quote(password)
DATABASE_URL = f"mysql+pymysql://{username}:{encoded_password}@{host}/{database}"

engine = create_engine(DATABASE_URL, echo=True)

# Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configurations
SECRET_KEY = "mysecretey"
REFRESH_SECRET_KEY = "myrefreshsecretkey"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 180
REFRESH_TOKEN_EXPIRE_DAYS = 7

# OAuth2 Scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
oauth2_refresh_scheme = OAuth2PasswordBearer(tokenUrl="refresh")


app.mount("/assets", StaticFiles(directory="assets"), name="assets")
# Ensure 'static/images/' directory exists
UPLOAD_DIR = "assets/images/"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# Database Models
class Address(SQLModel, table=True):
    addressID: int = Field(default=None, primary_key=True)
    customerID: int
    name:str
    countryID: int
    state: str
    district: str
    city: str
    street: str
    building_name: str
    pincode: str
    phone_number: str


class ShippingRate(SQLModel, table=True):
    __tablename__ = "shipping_rates"
    id :int = Field(default=None, primary_key=True)
    country_name:str
    shipping_cost : float = Field(..., sa_column=Column(DECIMAL(10,2)), gt=0) 

class Users(SQLModel, table=True):
    userID: int = Field(default=None, primary_key=True)
    name: str
    email: str
    password: str
    role: str
    profile_image:str
    created_at: datetime.datetime = Field(
        sa_column=Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    )

class Customer(SQLModel, table=True):
    __tablename__ = "customers"
    CustomerID: int = Field(default=None, primary_key=True)
    FirstName: str
    LastName: str
    Email: str
    PhoneNumber: str
    Password: str
    CreatedAt: datetime.datetime = Field(
        sa_column=Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    )
    
class Cart(SQLModel, table=True):
    cartID: int = Field(default=None, primary_key=True)
    customerID: int
    status: str = Field(default="active") 

class Products(SQLModel, table=True):
    productID: int = Field(default=None, primary_key=True)
    name: str
    description: str
    SKU: str
    price: int
    quantity: int
    image_path: Optional[str] = Field(default=None, max_length=500) 

class Category(SQLModel, table=True):
    categoryID: int = Field(default=None, primary_key=True)
    name: str
    parentID: Optional[int] = Field(default=None, foreign_key="category.categoryID")
    description: Optional[str] = Field(default=None)
    path: Optional[str] = Field(default=None, max_length=1000)  

class Cat_prod(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    productID: int
    categoryID: int

class CategoryAssignment(SQLModel):
    productID: int
    categoryIDs: List[int]

class MulProdCategoryAssignment(SQLModel):
    productIDs: List[int]
    categoryID: int


class CategoryCreate(SQLModel):
    name: str
    parentID: Optional[int] = None
    description: Optional[str] = None

class Cart_prod(SQLModel, table=True):
    cartID: int = Field()
    productID: int = Field()
    price: float
    quantity:int

    __table_args__ = (PrimaryKeyConstraint('cartID', 'productID'),)


class AddressCreate(SQLModel):
    customerID: int
    name: str
    countryID: int
    state: str
    district: str
    city: str
    street: str
    building_name:str
    pincode: str
    phone_number: str

class Orders(SQLModel, table=True):
    orderID: Optional[int] = Field(default=None, primary_key=True)
    customerID: int = Field(..., foreign_key="customers.CustomerID")
    addressID: int = Field(..., foreign_key="address.addressID")
    total_price: float = Field(..., sa_column=Column(DECIMAL(10,2)), gt=0)  # Decimal type to match MySQL

    created_at: datetime.datetime = Field(
        sa_column=Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    )
    updated_at: datetime.datetime = Field(
        sa_column=Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"))
    )

    delivery_date: Optional[datetime.date] = None

    status: str = Field(
        default="pending",
        sa_column=Column(
            Enum("pending", "confirmed", "shipped", "out_for_delivery", "delivered", "cancelled", "returned", "return_requested", "return_approved","picked_up", name="order_status_enum"),
            default="pending"
        )
    )

    payment_status: str = Field(
        default="pending",
        sa_column=Column(
            Enum("pending", "paid", "failed", "refunded", name="payment_status_enum"),
            default="pending"
        )
    )

    invoice_path:str

class Order_prod(SQLModel, table=True):
    orderID: int = Field(primary_key=True)
    productID: int = Field( primary_key=True)
    quantity: int = Field(..., gt=0)  # Must be greater than 0
    price: float = Field(..., ge=0) 

class Payments(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    orderID: int = Field(foreign_key="orders.orderID")
    customerID: int = Field(foreign_key="customers.CustomerID")
    payment_method: str = Field(..., max_length=20)  # ENUM equivalent
    transactionID: Optional[str] = Field(default=None, unique=True, max_length=255)
    amount: float = Field(..., gt=0)  # Ensure positive value
    status: str = Field(default="pending", max_length=20)  # ENUM equivalent
    created_at: datetime.datetime = Field(
        sa_column=Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    )

class Returns(SQLModel, table=True):
    returnID: Optional[int] = Field(default=None, primary_key=True)
    orderID: int = Field(foreign_key="orders.orderID")
    customerID: int = Field(foreign_key="customers.CustomerID")
    reason: Optional[str] = None
    status: str = Field(default="requested", max_length=20)  # ENUM values in DB
    rejection_reason: Optional[str] = Field(default=None, max_length=255)  # New field for rejection reason
    requested_at: datetime.datetime = Field(
        sa_column=Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    )
    processed_at: Optional[datetime.datetime] = Field(
        sa_column=Column(TIMESTAMP, nullable=True)
    )
    pickup_addressID: int = Field(foreign_key="address.addressID")


class Refunds(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    returnID: Optional[int] = Field(default=None, foreign_key="returns.returnID")  # Make it optional
    cancellationID: Optional[int] = Field(default=None, foreign_key="order_cancellations.id")  # Also optional
    customerID: int = Field(foreign_key="customers.CustomerID")
    paymentID: int = Field(foreign_key="payments.id")

    refund_amount: float = Field(sa_column=Column(DECIMAL(10, 2), nullable=False))

    status: str = Field(
        default="pending",
        sa_column=Column(Enum("pending", "processed", "failed", name="refund_status_enum"), default="pending")
    )

    processed_at: Optional[datetime.datetime] = Field(sa_column=Column(TIMESTAMP, nullable=True))


class OrderCancellation(SQLModel, table=True):
    __tablename__ = "order_cancellations"
    id: Optional[int] = Field(default=None, primary_key=True)
    orderID: int = Field(foreign_key="orders.orderID")
    customerID: int = Field(foreign_key="customers.CustomerID")
    reason: Optional[str] = None
    
    status: str = Field(default="requested", sa_column=Column(Enum("requested", "approved", "rejected"), default="pending"))
    cancelled_at: datetime.datetime = Field(
        sa_column=Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    )



# Pydantic Model for User Creation (Input Validation)
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str
    profile_image: UploadFile = File(None),

class CustomerCreate(BaseModel):
    firstname: str
    lastname:str
    email: EmailStr
    phone:str
    password: Optional[str] = None
    

class DeleteUsersRequest(BaseModel):
    user_ids: List[int]

class DeleteProductsRequest(BaseModel):
    product_ids: List[int]



class ProductUpdate(BaseModel):
    name: str
    description: str
    SKU: str
    price: int
    quantity: Optional[int] = None
    category_ids: Optional[List[int]] = []

class ProductCreate(SQLModel):
    name: str
    description: str
    SKU: str
    price: int
    quantity: Optional[int] = None


class AddProductToCartRequest(BaseModel):
    customerID: int
    productID: int
    quantity: int
    price: float


class UpdateCartItemRequest(BaseModel):
    customerID: int
    productID: int
    quantity: int

class orderCreate(BaseModel):
    customerID: int
    addressID: int

    
class PasswordResetRequest(BaseModel):
    email: EmailStr



# Create Tables
SQLModel.metadata.create_all(engine)

# Dependency to get the database session
def get_db():
    with Session(engine) as session:
        yield session

# Function to hash password
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# Function to verify password
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# Authenticate User & Fetch Role
def authenticate_user(email: str, password: str, db: Session):
    user = db.exec(select(Users).where(Users.email == email)).first()
    
    if not user or not verify_password(password, user.password):
        return None
    return user

def authenticate_customer(email: str, password: str, db: Session):
    customer = db.exec(select(Customer).where(Customer.Email == email)).first()
    
    if not customer or not verify_password(password, customer.Password):
        return None
    return customer

# Function to create JWT Tokens
def create_access_token(data: dict, expires_delta: int = ACCESS_TOKEN_EXPIRE_MINUTES):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=expires_delta)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict, expires_delta: int = REFRESH_TOKEN_EXPIRE_DAYS):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(days=expires_delta)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)

# Login Endpoint
class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/token")
def login_for_access_token(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(login_data.username, login_data.password, db)
    if  user:
        access_token = create_access_token({"sub": user.email, "role": user.role})
        refresh_token = create_refresh_token({"sub": user.email, "role": user.role})
        return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer", "name": user.name, "email": user.email,"image_path":user.profile_image, "userID":user.userID }

        
    customer=authenticate_customer(login_data.username, login_data.password, db)
    if  customer:
        access_token = create_access_token({"sub": customer.Email,"customerid":customer.CustomerID, "role": "customer", "firstName": customer.FirstName, "lastName": customer.LastName, "phone": customer.PhoneNumber})
        refresh_token = create_refresh_token({"sub": customer.Email,"customerid":customer.CustomerID, "role": "customer"})
        return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer", "phone": customer.PhoneNumber,"lastname": customer.LastName,"firstname": customer.FirstName, "email": customer.Email, "customerid": customer.CustomerID}

    else:
     raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
         )

# Get Current User from Token
def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")

        if email is None or role is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"email": email, "role": role, "token": payload}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Access token expired, use refresh token")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

#  Add User (Admin Only) with Password Hashing
@app.post("/add-user")
async def add_user(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    role: str = Form(...),
    profile_image: UploadFile = File(None),  # Optional file upload
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    hashed_password = hash_password(password)

    image_path = None
    if profile_image:
        file_extension = profile_image.filename.split(".")[-1]
        file_name = f"{email}.{file_extension}"  # Save as email-based filename
        file_path = os.path.join(UPLOAD_DIR, file_name)

        with open(file_path, "wb") as buffer:
            buffer.write(await profile_image.read())  # Save file

        image_path = f"/assets/images/{file_name}"

    new_user = Users(
        name=name,
        email=email,
        password=hashed_password,
        role=role,
        profile_image=image_path,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User added successfully", "profile_image": image_path}


@app.get("/view-users")
def view_products(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] not in ["admin", "sales"]:
        raise HTTPException(status_code=403, detail="Access denied")

    users = db.exec(select(Users)).all()
    return {"Users": users}

@app.get("/view-users/{user_id}")
def get_user_details(user_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] not in ["manager", "admin", "sales"]:
        raise HTTPException(status_code=403, detail="Access denied")

    user = db.query(Users).filter(Users.userID == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {"name": user.name, "email": user.email}

@app.get("/view-profile/{user_id}")
def get_user_profile(user_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    # if current_user["role"] not in ["manager", "admin", "sales"]:
    #     raise HTTPException(status_code=403, detail="Access denied")

    user = db.query(Users).filter(Users.userID == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {"name": user.name, "email": user.email, "role":user.role,"profile_image":user.profile_image}



def get_all_subcategory_ids(category_id: int, db: Session) -> List[int]:
    subcategory_ids = []
    categories_to_check = [category_id]

    while categories_to_check:
        current_id = categories_to_check.pop()
        subcategory_ids.append(current_id)
        subcategories = db.exec(select(Category.categoryID).where(Category.parentID == current_id)).all()
        categories_to_check.extend(subcategories)

    return subcategory_ids

#  Add Product (Admin Only)
@app.post("/add-product")
async def add_product(
    name: str = Form(...),
    description: str = Form(...),
    SKU: str = Form(...),
    price: int = Form(...),
    quantity: int = Form(None),
    image: UploadFile = File(None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user["role"] not in ["admin"]:
        raise HTTPException(status_code=403, detail="Access denied")

    image_path = None
    if image:
        file_extension = image.filename.split(".")[-1]
        file_name = f"{SKU}.{file_extension}"  # Save as SKU-based name
        file_path = os.path.join(UPLOAD_DIR, file_name)

        with open(file_path, "wb") as buffer:
            buffer.write(await image.read())  # Save file

        image_path = f"/assets/images/{file_name}"

    new_product = Products(
        name=name,
        description=description,
        SKU=SKU,
        price=price,
        quantity=quantity,
        image_path=image_path,
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return {"message": "Product added successfully", "productID": new_product.productID}


def get_full_path(db: Session, category_id: Optional[int]) -> str:
    path_segments = []
    
    while category_id:
        category = db.get(Category, category_id)
        if not category:
            break
        path_segments.append(category.name)
        category_id = category.parentID  # Move up the hierarchy

    return "/".join(reversed(path_segments))  # Reverse to maintain root-first order

# View Products (Admin & Sales)
@app.get("/view-products")
def view_products(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db), category_id: Optional[int] = Query(None), product_id: Optional[int] = Query(None)):
    if current_user["role"] not in ["admin", "sales"]:
        raise HTTPException(status_code=403, detail="Access denied")

    if product_id:
        product = db.get(Products, product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"Product": product}

    if category_id:
        category_ids = get_all_subcategory_ids(category_id, db)
        products = db.exec(
            select(Products)
            .join(Cat_prod, Products.productID == Cat_prod.productID)
            .where(Cat_prod.categoryID.in_(category_ids))
        ).all()
        # Use a set to collect unique product IDs
        unique_products = {product.productID: product for product in products}.values()
    else:
        unique_products = db.exec(select(Products)).all()

    return {"Products": list(unique_products)}

# View Products customer
@app.get("/customer-view-products")
def view_products(db: Session = Depends(get_db), category_id: Optional[int] = Query(None), product_id: Optional[int] = Query(None)):

    if product_id:
        product = db.get(Products, product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"Product": product}

    if category_id:
        category_ids = get_all_subcategory_ids(category_id, db)
        products = db.exec(
            select(Products)
            .join(Cat_prod, Products.productID == Cat_prod.productID)
            .where(Cat_prod.categoryID.in_(category_ids))
        ).all()
        # Use a set to collect unique product IDs
        unique_products = {product.productID: product for product in products}.values()
    else:
        unique_products = db.exec(select(Products)).all()

    return {"Products": list(unique_products)}



# View Categories
@app.get("/view-categories")
def view_categories(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] not in ["admin", "sales",]:
        raise HTTPException(status_code=403, detail="Access denied")

    categories = db.exec(select(Category)).all()
    return {"Categories": categories}

# View Categories for customer
@app.get("/customer-view-categories")
def view_categories( db: Session = Depends(get_db)):

    categories = db.exec(select(Category)).all()
    return {"Categories": categories}

@app.put("/edit_profile/{user_id}")
async def update_user(
    user_id: int,
    name: str = Form(...),
    email: str = Form(...),
    profile_image: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user["email"] != email:
        raise HTTPException(status_code=403, detail="You can only update your own profile")

    user = db.query(Users).filter(Users.userID == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.name = name
    user.email = email

    if profile_image:
        file_extension = profile_image.filename.split(".")[-1]
        file_name = f"{email}.{file_extension}"  # Save as email-based filename
        file_path = os.path.join(UPLOAD_DIR, file_name)

        with open(file_path, "wb") as buffer:
            buffer.write(await profile_image.read())  # Save file

        user.profile_image = f"/assets/images/{file_name}"
        
   
    db.commit()
    return user

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    email:str

@app.put("/change-password/{user_id}")
async def change_password(
    user_id: int,
    request: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # Ensure the logged-in user is the one making the request
    if current_user["email"] != request.email:
        raise HTTPException(status_code=403, detail="You are not allowed to change this password")

    user = db.query(Users).filter(Users.userID == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(request.current_password, user.password):
        raise HTTPException(status_code=403, detail="Current password is incorrect")

    user.password = hash_password(request.new_password)
    db.commit()

    return {"message": "Password changed successfully"}



@app.put("/update-user/{user_id}")
def update_user(user_id: int, user_data: UserCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] not in ["admin"]:
        raise HTTPException(status_code=403, detail="Access denied")

    existing_user = db.get(Users, user_id)
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")

    existing_user.name = user_data.name
    existing_user.email = user_data.email
    existing_user.password = hash_password(user_data.password)
    existing_user.role = user_data.role

    db.commit()
    return {"message": "User updated successfully"}

@app.delete("/delete-user/{user_id}")
def delete_user(user_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    user = db.get(Users, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

@app.delete("/delete-users")
def delete_users(data: DeleteUsersRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    users_to_delete = db.query(Users).filter(Users.userID.in_(data.user_ids)).all()
    
    if not users_to_delete:
        raise HTTPException(status_code=404, detail="No users found to delete")

    for user in users_to_delete:
        db.delete(user)
    
    db.commit()
    return {"message": f"{len(users_to_delete)} users deleted successfully"}

#  Add Category (Admin Only)
@app.post("/add-category")
def add_category(data: CategoryCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] not in ["admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    # Generate the new category path
    new_category_path =  get_full_path(db, data.parentID)

    # Create new category
    new_category = Category(
        name=data.name,
        parentID=data.parentID,
        description=data.description,
        path=new_category_path+"/"+data.name
    )
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    return {"message": "Category added", "category": new_category}

# Assign Category to Product (Admin Only)
@app.post("/assign-category")
def assign_categories(data: CategoryAssignment, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] not in ["admin"]:
        raise HTTPException(status_code=403, detail="Access denied")

    # Ensure the product exists
    product = db.get(Products, data.productID)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    # Assign new categories
    for category_id in data.categoryIDs:
        db.add(Cat_prod(productID=data.productID, categoryID=category_id))

    db.commit()
    return {"message": "Categories assigned successfully"}

@app.post("/assign-mul-prod-category")
def assign_mul_prod_categories(data: MulProdCategoryAssignment, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] not in ["admin"]:
        raise HTTPException(status_code=403, detail="Access denied")

    # Ensure the product exists
    # # product = db.get(Products, data.productID)
    # if not product:
    #     raise HTTPException(status_code=404, detail="Product not found")
    # Assign new categories
    for product_id in data.productIDs:
        db.add(Cat_prod(productID=product_id, categoryID=data.categoryID))

    db.commit()
    return {"message": "Categories assigned successfully"}


# Pydantic model for the delete request
class DeleteCatProdRequest(BaseModel):
    productID: int
    categoryID: int

# Endpoint to delete a row from Cat_prod table

@app.delete("/delete-cat-prod")
def delete_cat_prod(data: DeleteCatProdRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    # Check if the direct mapping exists
    #cat_prod = db.exec(select(Cat_prod).where(Cat_prod.productID == data.productID).where(Cat_prod.categoryID == data.categoryID)).all()
    cat_prod=False
    if not cat_prod:
        # If not found, check in subcategories
        subcategory_ids = get_all_subcategory_ids(data.categoryID, db)
        cat_prod = db.exec(select(Cat_prod).where(Cat_prod.productID == data.productID).where(Cat_prod.categoryID.in_(subcategory_ids))).all()
        
        if not cat_prod:
            raise HTTPException(status_code=404, detail="Record not found")

    # Delete all found mappings
    for mapping in cat_prod:
        db.delete(mapping)
    
    db.commit()
    return {"message": "Records deleted successfully"}

@app.put("/update-product/{product_id}")
async def update_product(
    product_id: int,
    name: str = Form(...),
    description: str = Form(...),
    SKU: str = Form(...),
    price: int = Form(...),
    quantity: Optional[int] = Form(None),
    category_ids: Optional[List[int]] = Form([]),
    image: Optional[UploadFile] = File(None),  # ✅ Accept image file
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user["role"] not in ["manager", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")

    existing_product = db.get(Products, product_id)
    if not existing_product:
        raise HTTPException(status_code=404, detail="Product not found")

    existing_product.name = name
    existing_product.description = description
    existing_product.SKU = SKU
    existing_product.price = price
    existing_product.quantity = quantity

    # Remove old category assignments
    db.query(Cat_prod).filter(Cat_prod.productID == product_id).delete()

    # Assign new categories
    for category_id in category_ids:
        category = db.get(Category, category_id)
        if not category:
            raise HTTPException(status_code=400, detail=f"Category ID {category_id} not found")
        db.add(Cat_prod(productID=product_id, categoryID=category_id))

    # ✅ Save the new image if provided
    if image:
        file_extension = image.filename.split(".")[-1]
        file_name = f"{SKU}.{file_extension}"  # Save as SKU-based name
        file_path = os.path.join(UPLOAD_DIR, file_name)

        with open(file_path, "wb") as buffer:
            buffer.write(await image.read())  # Save file

        # Update the image path in the database
        existing_product.image_path = f"/assets/images/{file_name}"

    db.commit()
    return {"message": "Product updated successfully"}

@app.get("/get-product-categories/{product_id}")
def get_product_categories(product_id: int, db: Session = Depends(get_db)):
    assigned_categories = db.exec(select(Cat_prod.categoryID).where(Cat_prod.productID == product_id)).all()
    
    # assigned_categories might already be a list of integers, no need for indexing
    return {"assignedCategories": assigned_categories}

# Delete product (Accessible to Admin Only)
@app.delete("/delete-product/{product_id}")
def delete_product(product_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    product = db.get(Products, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}

@app.delete("/delete-products")
def delete_products(data: DeleteProductsRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    products_to_delete = db.query(Products).filter(Products.productID.in_(data.product_ids)).all()
    
    if not products_to_delete:
        raise HTTPException(status_code=404, detail="No products found to delete")

    for product in products_to_delete:
        db.delete(product)
    
    db.commit()
    return {"message": f"{len(products_to_delete)} products deleted successfully"}

@app.post("/refresh")
def refresh_access_token(refresh_token: str = Depends(oauth2_refresh_scheme)):
    try:
        payload = jwt.decode(refresh_token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")

        if not username:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        # Generate a new access token
        new_access_token = create_access_token({"sub": username, "role": role})

        return {"access_token": new_access_token, "role": role, "token_type": "bearer"}
    
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired, please log in again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@app.post("/customer-token-refresh")
def refresh_access_token(refresh_token: str = Depends(oauth2_refresh_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(refresh_token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        customerid: int = payload.get("customerid")
        role: str = payload.get("role")
        print("**************",customerid)
        if not customerid:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        
        customer = db.exec(select(Customer).where(Customer.CustomerID == customerid)).first()
        # Generate a new access token
        new_access_token = create_access_token({"sub": customer.Email,"customerid":customer.CustomerID, "role": "customer", "firstName": customer.FirstName, "lastName": customer.LastName, "phone": customer.PhoneNumber})

        return {"access_token": new_access_token, "role": role, "token_type": "bearer"}
    
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired, please log in again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


# Pydantic model for customer signup
class CustomerSignup(BaseModel):
    name: str
    email: EmailStr
    password: str

# Pydantic model for Cart Item Response
class CartItemResponse(BaseModel):
    productID: int
    name: str
    image_path: Optional[str]
    quantity: int
    price: float
    product_stock:int


@app.post("/send-email/")
async def send_order_email(email: EmailSchema, background_tasks: BackgroundTasks):
    background_tasks.add_task(send_email, email)
    return {"message": "Email is being sent in the background"}


#add coustomer
@app.post("/signup")
def signup(customer: CustomerSignup, db: Session = Depends(get_db)):
    # Check if email already exists
    existing_customer = db.query(Customer).filter(Customer.Email== customer.email).first()
    if existing_customer:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash the password
    hashed_password = pwd_context.hash(customer.password)

    # Create new customer record
    new_customer = Customer(Name=customer.name, Email=customer.email, Password=hashed_password)
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)

    return {"message": "Customer registered successfully", "customer_id": new_customer.CustomerID}


@app.post("/add-customer")
def add_customer(user_data: CustomerCreate, db: Session = Depends(get_db)):


    hashed_password = hash_password(user_data.password)

    new_customer = Customer(
        FirstName=user_data.firstname,
        LastName=user_data.lastname,
        Email=user_data.email,
        Password=hashed_password,
        PhoneNumber=user_data.phone
    )

    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)

    # Create a new cart entry for the customer
    new_cart = Cart(customerID=new_customer.CustomerID)
    db.add(new_cart)
    db.commit()
    
    return {"message": "User added successfully"}

#update customer

@app.put("/update-customer/{customer_id}")
def update_customer(customer_id: int, user_data: CustomerCreate, current_user: dict = Depends(get_current_user),  db: Session = Depends(get_db)):

    
    existing_customer = db.get(Customer, customer_id)
    
    if not existing_customer:
        raise HTTPException(status_code=404, detail="User not found")
    if(current_user["email"]!=existing_customer.Email):
        raise HTTPException(status_code=403, detail="Access denied")
    

    existing_customer.FirstName = user_data.firstname
    existing_customer.LastName = user_data.lastname
    existing_customer.Email = user_data.email
    existing_customer.PhoneNumber = user_data.phone

    db.commit()
    return {"message": "User updated successfully"}

@app.post("/add-product-cart")
def add_product_to_cart(data: AddProductToCartRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    print('%%%%%%%%%',data)
    existing_customer = db.get(Customer, data.customerID)
    if not existing_customer:
        raise HTTPException(status_code=404, detail="User not found")
    if current_user["email"] != existing_customer.Email:
        raise HTTPException(status_code=403, detail="Access denied")

    # Fetch the active cart from the Cart table using the provided customerID
    cart = db.exec(select(Cart).where(Cart.customerID == data.customerID).where(Cart.status == "active")).first()
    
    if not cart:
        # If no active cart is found, create a new cart with status "active"
        new_cart = Cart(customerID=data.customerID, status="active")
        db.add(new_cart)
        db.commit()
        db.refresh(new_cart)
        cart = new_cart

    # Check if the entry already exists in the cart_prod table
    existing_cart_prod = db.exec(select(Cart_prod).where(Cart_prod.cartID == cart.cartID).where(Cart_prod.productID == data.productID)).first()

    if existing_cart_prod:
        # Update the existing entry by incrementing the quantity
        existing_cart_prod.quantity += data.quantity
        existing_cart_prod.price = data.price  # Update the price if needed
    else:
        print("@@@@@@@@",data.quantity)
        # Insert a new entry into the cart_prod table
        new_cart_prod = Cart_prod(
            cartID=cart.cartID,
            productID=data.productID,
            quantity=data.quantity,
            price=data.price
        )
        db.add(new_cart_prod)

    db.commit()

    return {"message": "Product added to cart successfully"}


@app.get("/cart", response_model=list[CartItemResponse])
def get_cart_items(customerID: int = Query(..., description="Customer ID"), current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):

    existing_customer = db.get(Customer, customerID)
    
    if not existing_customer:
        raise HTTPException(status_code=404, detail="User not found")
    if(current_user["email"]!=existing_customer.Email):
        raise HTTPException(status_code=403, detail="Access denied")

    # Get cart for the given customerID
    cart = db.exec(select(Cart).where(Cart.customerID == customerID).where(Cart.status == "active")).first()
    if not cart:
        return []

    # Get products in the user's cart
    cart_items = (
        db.query(Cart_prod, Products)
        .join(Products, Cart_prod.productID == Products.productID)
        .filter(Cart_prod.cartID == cart.cartID)
        .all()
    )
    
    print("Raw cart_items:", cart_items)
    # Format response
    cart_response = [
        {
            "productID": product.productID,
            "name": product.name,
            "image_path": product.image_path,
            "quantity": cart_item.quantity,
            "price": product.price,
            "product_stock":product.quantity
        }
        for cart_item, product in cart_items
    ]
    print('^^^^^%%%%%%%%%%%%%',cart_response)
    return cart_response

@app.delete("/remove-cart-item")
def remove_cart_item(customerID: int = Query(..., description="Customer ID"), productID: int = Query(..., description="Product ID"), current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    
    existing_customer = db.get(Customer, customerID)
    
    if not existing_customer:
        raise HTTPException(status_code=404, detail="User not found")
    if(current_user["email"]!=existing_customer.Email):
        raise HTTPException(status_code=403, detail="Access denied")

    # Get cart for the given customerID
    cart =db.exec(select(Cart).where(Cart.customerID == customerID).where(Cart.status == "active")).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found for the given customerID")

    # Get the cart item to delete
    cart_item = db.query(Cart_prod).filter(Cart_prod.cartID == cart.cartID).filter(Cart_prod.productID == productID).first()
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    db.delete(cart_item)
    db.commit()

    return {"message": "Cart item removed successfully"}


@app.put("/update-cart-item")
def update_cart_item(data: UpdateCartItemRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    
    existing_customer = db.get(Customer, data.customerID)
    
    if not existing_customer:
        raise HTTPException(status_code=404, detail="User not found")
    if(current_user["email"]!=existing_customer.Email):
        raise HTTPException(status_code=403, detail="Access denied")

    # Get cart for the given customerID
    cart = db.exec(select(Cart).where(Cart.customerID == data.customerID).where(Cart.status == "active")).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found for the given customerID")

    # Get the cart item to update
    cart_item = db.query(Cart_prod).filter(Cart_prod.cartID == cart.cartID).filter(Cart_prod.productID == data.productID).first()
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    cart_item.quantity = data.quantity
    db.commit()

    return {"message": "Cart item updated successfully"}


class ClearCartRequest(BaseModel):
    customerID: int

@app.put("/clear-cart")
def clear_cart(request: ClearCartRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    customerID = request.customerID  # Extract from request body
    
    existing_customer = db.get(Customer, customerID)
    if not existing_customer:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user["email"] != existing_customer.Email:
        raise HTTPException(status_code=403, detail="Access denied")

    # Get active cart for the given customerID
    cart = db.exec(select(Cart).where(Cart.customerID == customerID).where(Cart.status == "active")).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found for the given customerID")

    # Mark cart as abandoned
    cart.status = "abandoned"
    db.commit()
    
    return {"message": "Cart cleared successfully"}
@app.post("/add-address")
def add_address(address: AddressCreate, current_user: dict = Depends(get_current_user),  db: Session = Depends(get_db)):
    existing_customer = db.get(Customer, address.customerID)
    
    if not existing_customer:
        raise HTTPException(status_code=404, detail="User not found")
    if(current_user["email"]!=existing_customer.Email):
        
        raise HTTPException(status_code=403, detail="Access denied")
    new_address = Address(**address.dict())
    db.add(new_address)
    db.commit()
    db.refresh(new_address)
    return new_address



@app.get("/view-addresses")
def get_addresses(
    customerID: int = Query(..., description="Customer ID"), 
    current_user: dict = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # Check if the customer exists
    existing_customer = db.get(Customer, customerID)
    if not existing_customer:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Ensure the logged-in user is only accessing their own addresses
    if current_user["email"] != existing_customer.Email:
        raise HTTPException(status_code=403, detail="Access denied")

    # Fetch all addresses and join with ShippingRate to get country_name
    addresses = (
        db.exec(
            select(
                Address.addressID,
                Address.customerID,
                Address.name,
                Address.state,
                Address.district,
                Address.city,
                Address.street,
                Address.building_name,
                Address.pincode,
                Address.phone_number,
                Address.countryID,
                ShippingRate.country_name.label("country")  # Get country name
            )
            .join(ShippingRate, ShippingRate.id == Address.countryID)
            .where(Address.customerID == customerID)
        )
        .all()
    )

    # Convert result to a list of dictionaries
    address_list = [dict(zip(row._fields, row)) for row in addresses]

    return jsonable_encoder(address_list)
@app.get("/countries", tags=["Address"])
def get_countries(db: Session = Depends(get_db)):
    """Fetch all countries from shipping_rates table"""
    countries = db.exec(select(ShippingRate)).all()
    print(countries)
    return [{"id": country.id, "name": country.country_name} for country in countries]


@app.put("/update-address/{addressID}")
def update_address(addressID: int, address: AddressCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    existing_address = db.get(Address, addressID)
    if not existing_address:
        raise HTTPException(status_code=404, detail="Address not found")
    existing_customer = db.get(Customer, existing_address.customerID)
    if not existing_customer:
        raise HTTPException(status_code=404, detail="User not found")
    if(current_user["email"]!=existing_customer.Email):
        
        raise HTTPException(status_code=403, detail="Access denied")
    existing_address.name = address.name
    existing_address.building_name = address.building_name
    existing_address.countryID = address.countryID
    existing_address.state = address.state
    existing_address.district = address.district
    existing_address.city = address.city
    existing_address.street = address.street
    existing_address.pincode = address.pincode
    existing_address.phone_number = address.phone_number
    db.commit()
    return {"message": "Address updated successfully"}

@app.delete("/delete-address/{addressID}")
def delete_address(addressID: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    existing_address = db.get(Address, addressID)
    if not existing_address:
        raise HTTPException(status_code=404, detail="Address not found")
    existing_customer = db.get(Customer, existing_address.customerID)
    if not existing_customer:
        raise HTTPException(status_code=404, detail="User not found")
    if(current_user["email"]!=existing_customer.Email):
        
        raise HTTPException(status_code=403, detail="Access denied")
    db.delete(existing_address)
    db.commit()
    return {"message": "Address deleted successfully"}

@app.get("/shipping-rate/{country_id}")
def get_shipping_rate(country_id: int, db: Session = Depends(get_db)):
    rate = db.query(ShippingRate).filter(ShippingRate.id == country_id).first()
    if not rate:
        raise HTTPException(status_code=404, detail="Shipping rate not found for this country")
    return {"shipping_cost": float(rate.shipping_cost)}

@app.post("/create-order")
def create_order(order_data: orderCreate, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        existing_customer = db.get(Customer, order_data.customerID)
        if not existing_customer:
            raise HTTPException(status_code=404, detail="User not found")
        if current_user["email"] != existing_customer.Email:
            raise HTTPException(status_code=403, detail="Access denied")

        existing_address = db.get(Address, order_data.addressID)
        if not existing_address:
            raise HTTPException(status_code=404, detail="Address not found")

        cart = db.exec(select(Cart).where(Cart.customerID == order_data.customerID).where(Cart.status == "active")).first()
        if not cart:
            raise HTTPException(status_code=404, detail="Cart not found")

        cart_items = db.exec(select(Cart_prod).where(Cart_prod.cartID == cart.cartID)).all()
        if not cart_items:
            raise HTTPException(status_code=404, detail="No items in the cart")
        shipping_rate = db.query(ShippingRate).filter(ShippingRate.id == existing_address.countryID).first()
        shipping_cost = float(shipping_rate.shipping_cost)
        total_price = sum([float(cart_item.price) * cart_item.quantity for cart_item in cart_items]) + shipping_cost


        new_order = Orders(
            customerID=order_data.customerID,
            addressID=order_data.addressID,
            total_price=total_price,
            status="pending"
        )
        db.add(new_order)
        db.commit()
        db.refresh(new_order)
        ordered_products = []  # Store product details for invoice
        for cart_item in cart_items:
            existing_orderprod = db.exec(select(Order_prod)
                .where(Order_prod.orderID == new_order.orderID)
                .where(Order_prod.productID == cart_item.productID)
            ).first()

            if existing_orderprod:
                continue  # Skip duplicate entries

            new_order_prod = Order_prod(
                orderID=new_order.orderID,
                productID=cart_item.productID,
                quantity=cart_item.quantity,
                price=cart_item.price
            )
            db.add(new_order_prod)
            product=db.exec(select(Products).where(Products.productID==cart_item.productID)).first()
            product.quantity=product.quantity-cart_item.quantity
            # Store product details for invoice generation
            ordered_products.append({
                "name": product.name,
                "quantity": cart_item.quantity,
                "price": cart_item.price,
                # "image": product.image_path
            })

        db.commit()
        cart.status = "completed"
        db.commit()
        # ✅ Step 7: Generate Invoice PDF
        order_details = {
            "orderID": new_order.orderID,
            "customer_name": f"{existing_customer.FirstName} {existing_customer.LastName}",
            "customerEmail": existing_customer.Email,
            "customerPhone": existing_customer.PhoneNumber,
            "delivery_address": f"{existing_address.name}, {existing_address.street}, {existing_address.city}, {existing_address.state}, - {existing_address.pincode}",
            "total_price": new_order.total_price,
            "products": ordered_products
        }
        invoice_path = generate_invoice(order_details) 
        new_order.invoice_path=invoice_path
        db.commit() 
        email = EmailSchema(
            email=existing_customer.Email,
            subject="Order Confirmation",
            body=f"<h1>Thank you for your order #{new_order.orderID}!</h1><p>Your order has been placed successfully.</p>"
        )
        background_tasks.add_task(send_email, email, invoice_path)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Order creation failed: {str(e)}")
    return {"message": "Order created successfully", "orderID": new_order.orderID, "total_price": new_order.total_price, "status": new_order.status}
    
@app.get("/view-orders")
def view_orders(customerID: int = Query(..., description="Customer ID") , current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    existing_customer = db.get(Customer, customerID)
    if not existing_customer:
        raise HTTPException(status_code=404, detail="User not found")
    if(current_user["email"]!=existing_customer.Email):
        
        raise HTTPException(status_code=403, detail="Access denied")

    orders = db.exec(select(Orders).where(Orders.customerID == customerID)).all()
    return orders

# should fetch country
@app.get("/view-order/{orderID}")
def view_order_products(orderID: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check if the order exists
    existing_order = db.get(Orders, orderID)
    if not existing_order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Verify if the current user is authorized to view the order
    existing_customer = db.get(Customer, existing_order.customerID)
    if not existing_customer or current_user["email"] != existing_customer.Email:
        raise HTTPException(status_code=403, detail="Access denied")

    # Retrieve the delivery address details
    delivery_address = db.get(Address, existing_order.addressID)
    if not delivery_address:
        raise HTTPException(status_code=404, detail="Delivery address not found")
    country=db.get(ShippingRate, delivery_address.countryID)
    # Concatenate the delivery address as a single string
    delivery_address_str = f"{delivery_address.name}, {delivery_address.building_name}, {delivery_address.street}, {delivery_address.district}, {delivery_address.state},{country.country_name}  - {delivery_address.pincode}"

    # Retrieve products associated with the given orderID along with product details
    order_products = (
        db.exec(
            select(Order_prod, Products)
            .join(Products, Order_prod.productID == Products.productID)  # Join Order_prod with Products
            .where(Order_prod.orderID == orderID)
        )
        .all()
    )

    if not order_products:
        raise HTTPException(status_code=404, detail="No products found for this order")

    # Fetch the latest return request for the given order
    latest_return = db.exec(
        select(Returns)
        .where(Returns.orderID == orderID)
        .order_by(desc(Returns.requested_at))  # Sort by latest request first
    ).first()

    # Determine if the latest return was rejected
    return_rejected = latest_return is not None and latest_return.status == "rejected"
    rejection_reason =''
    if(latest_return is not None and latest_return.status == "rejected"):
        rejection_reason=latest_return.rejection_reason
    # Transform data into a structured response
    products = [
        {
            "productID": product.productID,
            "name": product.name,
            "description": product.description,
            "SKU": product.SKU,
            "price": product.price,
            "quantity": order_prod.quantity,  # Ordered quantity
            "image_path": product.image_path
        }
        for order_prod, product in order_products
    ]

    return {
        "orderID": orderID,
        "created_at": existing_order.created_at,
        "status": existing_order.status,
        "total_price": existing_order.total_price,
        "delivery_address": delivery_address_str,  # ✅ Include formatted address
        "products": products,
        "ShippingRate":country.shipping_cost,
        "rejected_reason": rejection_reason ,
        "rejected": return_rejected  # ✅ Include boolean return rejection status
    }




class UpdateOrderStatusRequest(BaseModel):
    status: str
    reason:Optional[str] = None

@app.put("/update-order-status/{orderID}")
def update_order_status(orderID: int, status: UpdateOrderStatusRequest,background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    existing_order = db.get(Orders, orderID)
    if not existing_order:
        raise HTTPException(status_code=404, detail="Order not found")
    existing_customer = db.get(Customer, existing_order.customerID)
    if not existing_customer:
        raise HTTPException(status_code=404, detail="User not found")
    print('1233**************88*****8',current_user["email"],existing_customer.Email,current_user["role"],"*********8")
    if(current_user["email"]!=existing_customer.Email and current_user["role"] not in ["admin"]):
        raise HTTPException(status_code=403, detail="Access denied beacue *****")

    # Get cart for the given customerID
    order= db.exec(select(Orders).where(Orders.orderID == orderID)).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if(status.status=="confirmed"):
        order.payment_status="paid"
        date= datetime.datetime.now() 
        transaction_id = f"{order.customerID}-{date}"

        # Create payment record
        payment = Payments(
            orderID=order.orderID,
            customerID=order.customerID,
            payment_method="cod",
            transactionID=transaction_id,
            amount=order.total_price,
            status="successful"
        )

        db.add(payment)

    elif((status.status=="cancelled" ) and (order.status=="delivered" or order.status=="return_requested" or order.status=="return_approved" or order.status=="returned")):
        raise HTTPException(status_code=303, detail="Your return is already processed")
    elif(status.status=="cancelled"):
        cancellation=OrderCancellation(
            orderID=order.orderID,
            customerID=order.customerID
        )
        db.add(cancellation)
        db.commit()
        db.refresh(cancellation)
        payment = db.exec(select(Payments).where(Payments.orderID == orderID)).first()
        if(payment):
         refund=Refunds(
            cancellationID=cancellation.id,
            customerID=order.customerID,
            paymentID=payment.id,
            refund_amount=payment.amount,
            status="pending",  # Initially set to pending
            processed_at=text("CURRENT_TIMESTAMP")
          )
         db.add(refund)
         order.payment_status="refunded"
         payment.status="refunded"
        order_products = (
        db.exec(
            select(Order_prod, Products)
            .join(Products, Order_prod.productID == Products.productID)  # Join Order_prod with Products
            .where(Order_prod.orderID == orderID)
        )
        .all()
        )
        for order_prod, product in order_products:
            product.quantity=product.quantity+order_prod.quantity
        db.commit
        email = EmailSchema(
            email=existing_customer.Email,
            subject="Order Cancelled",
            body=f"<h1>Youur order #{orderID}!</h1><p> has been  cancelled.</p>"
        )
        background_tasks.add_task(send_email, email)
        

    elif(order.status=="return_requested" and status.status=="delivered"):
        print("*************8inside ")
        returnOrder=db.exec(
        select(Returns)
        .where(Returns.orderID == orderID).where(Returns.status=="requested")  # Sort by latest request first
        ).first()
        print("%%%%%%%%%%%%%%%%",returnOrder)
        returnOrder.status='cancelled'
        db.add(returnOrder)
        email = EmailSchema(
            email=existing_customer.Email,
            subject="Return request Cancelled",
            body=f"<h1>Youur order #{orderID}!</h1><p> return request has been  cancelled.</p>"
        )
        background_tasks.add_task(send_email, email)


    elif((order.status=="picked_up" or order.status=="returned") and status.status=="delivered"):
        raise HTTPException(status_code=303, detail="Your return is already processed")
        

    elif(status.status=="return_requested"):
        print('4444444444444444442@@@@@@@@@@@@')
        orderreturn=Returns(
            orderID=order.orderID,
            customerID=order.customerID,
            reason=status.reason,
            status="requested",
            pickup_addressID=order.addressID,
        )
        db.add(orderreturn)
        email = EmailSchema(
            email=existing_customer.Email,
            subject="Return requested",
            body=f"<h1>Your order #{orderID}!</h1><p> has return requested.</p>"
        )
        background_tasks.add_task(send_email, email)
    elif(status.status=="shipped"):
        # order.status = status.status
        email = EmailSchema(
            email=existing_customer.Email,
            subject="Order shipped",
            body=f"<h1>Your order #{orderID}!</h1><p>  has been  shipped.</p>"
        )
        background_tasks.add_task(send_email, email)

    elif(status.status=="delivered"):
        # order.status = status.status
        email = EmailSchema(
            email=existing_customer.Email,
            subject="Order delivered",
            body=f"<h1>Your order #{orderID}!</h1><p>  has been  delivered.</p>"
        )
        background_tasks.add_task(send_email, email)

    order.status = status.status
    db.commit()
    db.refresh(order) 
    

    return {"message": "order updated successfully", "status_code":200}




@app.get("/admin-view-orders")
def view_orders(current_user: dict = Depends(get_current_user),db: Session = Depends(get_db)):

    if current_user["role"] not in ["admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    # Fetch all orders along with customer email and address
    orders_with_details = (
        db.exec(
            select(Orders, Customer.Email, Address)
            .join(Customer, Orders.customerID == Customer.CustomerID)
            .join(Address, Orders.addressID == Address.addressID)
        ).all()
    )

    # Format response
    response = []
    for order, email, address in orders_with_details:
        response.append({
            "orderID": order.orderID,
            "customerID": order.customerID,
            "customerEmail": email,
            "amount": order.total_price,
            "created_At": order.created_at,
            "status": order.status,
            
            
        })
    
    return response
    



@app.get("/admin-view-order/{orderID}")
def view_order(orderID: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    # Ensure only admin can access
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    # Fetch order details
    order = db.get(Orders, orderID)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Fetch customer details
    customer = db.get(Customer, order.customerID)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Fetch address details
    address = db.get(Address, order.addressID)
    country=db.get(ShippingRate, address.countryID)
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    # Concatenate address into a formatted string
    address_str = (
        f"{address.name}, {address.building_name}, {address.street}, "
        f"{address.district}, {address.state}, {country.country_name} - {address.pincode}"
    )

    # Fetch ordered products with product details
    order_products = (
        db.exec(
            select(Order_prod, Products)
            .join(Products, Order_prod.productID == Products.productID)
            .where(Order_prod.orderID == orderID)
        )
        .all()
    )

    # Structure product details
    products = [
        {
            "productID": product.productID,
            "name": product.name,
            "image": product.image_path,
            "description": product.description,
            "SKU": product.SKU,
            "price": product.price,
            "quantity": order_prod.quantity,
            "total_price": order_prod.quantity * product.price
        }
        for order_prod, product in order_products
    ]

    # If the order is return_requested, fetch return details
    return_details = None
    if order.status == "return_requested":
        return_record = db.exec(select(Returns).where(Returns.orderID == orderID)).first()

        if return_record:
            pickup_address= (
            db.exec(
             select(
                Address.addressID,
                Address.customerID,
                Address.name,
                Address.state,
                Address.district,
                Address.city,
                Address.street,
                Address.building_name,
                Address.pincode,
                Address.phone_number,
                Address.countryID,
                ShippingRate.country_name.label("country")  # Get country name
            )
            .join(ShippingRate, ShippingRate.id == Address.countryID)
            .where(Address.addressID == return_record.pickup_addressID)
            )
            .first()
            )
            # pickup_address = db.get(Address, return_record.pickup_addressID)
            if not pickup_address:
                raise HTTPException(status_code=404, detail="Pickup address not found")

            pickup_address_str = (
                f"{pickup_address.name}, {pickup_address.building_name}, {pickup_address.street}, "
                f"{pickup_address.district}, {pickup_address.state}, {pickup_address.country} - {pickup_address.pincode}"
            )

            return_details = {
                "returnID": return_record.returnID,
                "requested_at": return_record.requested_at,
                "reason": return_record.reason,
                "status": return_record.status,
                "pickup_address": pickup_address_str
            }

    return {
        "orderID": order.orderID,
        "customerID": order.customerID,
        "customer_name": f"{customer.FirstName} {customer.LastName}",
        "customerEmail": customer.Email,
        "customerPhone": customer.PhoneNumber,
        "total_price": order.total_price,
        "created_at": order.created_at,
        "status": order.status,
        "payment_status":order.payment_status,
        "delivery_address": address_str,
        "products": products,
        "return_details": return_details  # Includes return details if applicable
    }


class UpdateReturnRequest(SQLModel):
    orderID: int
    status: Literal["approved", "rejected",'picked_up','refunded'] 
    rejection_reason: Optional[str] = None 

@app.post("/update-returns")
def update_return_status(
    request: UpdateReturnRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Ensure only admin can perform this action
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    # Fetch the return request
    return_request = db.exec(
        select(Returns)
        .where(Returns.orderID == request.orderID)
        .order_by(desc(Returns.requested_at))  # Sort by latest request first
    ).first()
    if not return_request:
        raise HTTPException(status_code=404, detail="Return request not found")

    # Fetch the order
    order = db.get(Orders, request.orderID)
    customer=db.get(Customer, return_request.customerID)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Update return request status
    if request.status == "approved":
        return_request.status = "approved"
        return_request.processed_at = text("CURRENT_TIMESTAMP")
        order.status = "return_approved"  # Update order status
        email = EmailSchema(
            email=customer.Email,
            subject="Return request Approved",
            body=f"<h1>Your return request approved !</h1><p> your return request for order #{return_request.orderID} has been approved</p>"
        )
        background_tasks.add_task(send_email, email)
    elif request.status == "rejected":
        return_request.status = "rejected"
        return_request.rejection_reason=request.rejection_reason
        return_request.processed_at = text("CURRENT_TIMESTAMP")
        order.status = "delivered"  # Keep order status as delivered if return is rejected
        email = EmailSchema(
            email=customer.Email,
            subject="Return request rejected",
            body=f"<h1>Your return request rejected !</h1><p> your return request for order #{return_request.orderID} has been rejected</p>"
        )
        background_tasks.add_task(send_email, email)
    elif request.status == "picked_up":
        return_request.status = "picked_up"
        order.status = "picked_up" 
        email = EmailSchema(
            email=customer.Email,
            subject="Return pciked up",
            body=f"<h1>Your return picked up !</h1><p> your return request for order #{return_request.orderID} has been picked up</p>"
        )
        background_tasks.add_task(send_email, email)
    elif request.status == "refunded":
        return_request.status = "refunded"
        order.status = "returned"
        order.payment_status="refunded"

        # Fetch payment details for the order
        payment = db.exec(select(Payments).where(Payments.orderID == request.orderID)).first()
        if not payment:
            raise HTTPException(status_code=404, detail="Payment record not found")

        # Create a refund entry
        refund = Refunds(
            returnID=return_request.returnID,
            customerID=order.customerID,
            paymentID=payment.id,
            refund_amount=payment.amount,
            status="pending",  # Initially set to pending
            processed_at=text("CURRENT_TIMESTAMP")
        )
        db.add(refund)
        email = EmailSchema(
            email=customer.Email,
            subject="Return processed",
            body=f"<h1>Your return is succesfull!</h1><p> your return request for order #{return_request.orderID} has is successful and refund initiated</p><h3>Your refund details:</h3><p>Refund amount : {refund.refund_amount}</p><p>Processed on:{refund.processed_at}</p>"

        )
        background_tasks.add_task(send_email, email)

    # Commit changes
    db.add(return_request)
    db.add(order)
    db.commit()
    db.refresh(return_request)
    db.refresh(order)

    return {"message": f"Return request {request.status} successfully", "order_status": order.status}

@app.get("/view-refund/{orderID}")
def view_refund(orderID: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
 

    # Fetch the order
    order = db.get(Orders, orderID)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Ensure the user is either admin or the owner of the order
    existing_customer = db.get(Customer, order.customerID)
    if not existing_customer or current_user["email"] != existing_customer.Email:
        raise HTTPException(status_code=403, detail="Access denied")

    # Fetch return request related to the order
    if(order.status=="returned"):
       return_request = db.exec(select(Returns).where(Returns.orderID == orderID).where(Returns.status=="refunded")).first()
       if not return_request:
          raise HTTPException(status_code=404, detail="Return request not found")

       # Fetch refund details
       refund = db.exec(select(Refunds).where(Refunds.returnID == return_request.returnID)).first()
       if not refund:
          raise HTTPException(status_code=404, detail="Refund not found")
    if(order.status=="cancelled"):
        cancellation=db.exec(select(OrderCancellation).where(OrderCancellation.orderID ==  orderID)).first()
        refund = db.exec(select(Refunds).where(Refunds.cancellationID == cancellation.id)).first()
    # Fetch payment details
    if(refund):
      payment = db.get(Payments, refund.paymentID)
      if not payment:
         raise HTTPException(status_code=404, detail="Payment record not found")

      return {
        "refund_id": refund.id,
        "order_id": orderID,
        "customer_id": refund.customerID,
        "payment_id": refund.paymentID,
        "refund_amount": refund.refund_amount,
        "refund_status": refund.status,
        "processed_at": refund.processed_at,
        "original_payment": {
            "transaction_id": payment.transactionID,
            "amount": payment.amount,
            "payment_status": payment.status,
            "payment_method": payment.payment_method,
            "created_at": payment.created_at,
        }
    }
    else:
        return {"message":"No refund found for this order"}



def create_reset_token(email: str):
    """Generate a password reset token with expiration"""
    expire = datetime.datetime.utcnow() + timedelta(hours=1)  # Token expires in 1 hour
    payload = {"sub": email, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_reset_token(token: str):
    """Verify token and return email if valid"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload["sub"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Access token expired, use refresh token")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    

@app.post("/forgot-password")
async def forgot_password(request: PasswordResetRequest,background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(Users).filter(Users.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")
    
    reset_token = create_reset_token(user.email)
    background_tasks.add_task(send_reset_email, user.email, reset_token)
    
    return {"message": "Password reset link sent to your email."}

class ResetPassword(BaseModel):
    token: str
    new_password: str

@app.post("/reset-password")
async def reset_password(request: ResetPassword, db: Session = Depends(get_db)):
    email = verify_reset_token(request.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user = db.query(Users).filter(Users.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    hashed_password = pwd_context.hash(request.new_password)
    user.password = hashed_password
    db.commit()

    return {"message": "Password reset successfully."}


