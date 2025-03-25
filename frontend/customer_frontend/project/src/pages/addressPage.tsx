import { useEffect, useState } from "react";
import useAuthStore from "../store/authStore"; // Import auth store
import { Address } from "../types";
import { addressAPI } from '../api';

const AddressPage = () => {
    const { user } = useAuthStore();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [editMode, setEditMode] = useState<number | null>(null);
    const [newAddress, setNewAddress] = useState<Omit<Address, "addressID">>({
      customerID: user?.customerid || 0,
      name: "",
      countryID: 0,
      country: "",
      state: "",
      district: "",
      city: "",
      street: "",
      building_name: "",
      pincode: "",
      phone_number: "",
    });
    const [editAddress, setEditAddress] = useState<Address | null>(null); // State for the address being edited
    const [isModalOpen, setIsModalOpen] = useState(false); // State for add address modal visibility
    const [isEditModalOpen, setIsEditModalOpen] = useState(false); // State for edit address modal visibility
    const [countries, setCountries] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
  const fetchCountries = async () => {
    try {
      const response = await addressAPI.getCountries();
      setCountries(response);
      console.log(response);
    } catch (error) {
      console.error("Error fetching countries", error);
    }
  };

  fetchCountries();
}, []);


    useEffect(() => {
      if (user?.customerid) {
        fetchAddresses();
      }
    }, [user]);
  
    const fetchAddresses = async () => {
      try {
        if (user) {
          const data = await addressAPI.getAddresses(user.customerid);
          console.log(data);
          setAddresses(data);
        }
        
      } catch (error) {
        console.error("Error fetching addresses", error);
      }
    };
  
    // const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //   setNewAddress({ ...newAddress, [e.target.name]: e.target.value });
    // };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
    
      setNewAddress((prev) => ({
        ...prev,
        [name]: name === "countryID" ? Number(value) : value // Ensure countryID is a number
      }));
    };
    
    
  
    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
    
      setEditAddress((prev) =>
        prev ? { ...prev, [name]: value } : null
      );
    };
    
    
    
  
    const handleAddAddress = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await addressAPI.addAddress(newAddress);
        fetchAddresses();
        setNewAddress({
          customerID: user?.customerid ?? 0,
          name: "",
          country: "",
          countryID: 0,
          state: "",
          district: "",
          city: "",
          street: "",
          building_name: "",
          pincode: "",
          phone_number: "",
        });
        setIsModalOpen(false); // Close the modal after adding the address
      } catch (error) {
        console.error("Error adding address", error);
      }
    };
  
    const handleUpdateAddress = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editAddress) return;
  
      try {
        await addressAPI.updateAddress(editAddress.addressID, editAddress);
        setEditMode(null);
        setIsEditModalOpen(false); // Close the modal after updating the address
        fetchAddresses();
      } catch (error) {
        console.error("Error updating address", error);
      }
    };
  
    const handleDeleteAddress = async (addressID: number) => {
      try {
        await addressAPI.deleteAddress(addressID);
        fetchAddresses();
      } catch (error) {
        console.error("Error deleting address", error);
      }
    };
  
    const openEditModal = (address: Address) => {
      setEditAddress(address);
      setIsEditModalOpen(true);
    };
  
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Your Addresses</h2>
  
        {/* Button to open the add address modal */}
        <button onClick={() => setIsModalOpen(true)} className="bg-green-500 text-white px-4 py-2 mb-4 rounded hover:bg-green-600">
          Add New Address
        </button>
  
        {/* Modal for adding new address */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded shadow-md w-full max-w-lg">
              <h3 className="text-xl font-semibold mb-4">Add New Address</h3>
              <form onSubmit={handleAddAddress}>
                <div className="grid grid-cols-1 gap-4">
                  <input type="text" name="name" value={newAddress.name} onChange={handleChange} placeholder="Name" className="border p-2 rounded" required />
                  <label className="block">
                      <span className="text-gray-700">Country</span>
                       <select 
                          name="countryID" 
                          value={newAddress.countryID || ""} 
                          onChange={handleChange} 
                          className="border p-2 rounded w-full mt-1" 
                           required
                         >
                          <option value="">Select Country</option>
                            {countries.map((country) => (
                              <option key={country.id} value={country.id}>
                               {country.name}
                            </option>
                               ))}
                          </select>
                       </label>                  
                  <input type="text" name="state" value={newAddress.state} onChange={handleChange} placeholder="State" className="border p-2 rounded" required />
                  <input type="text" name="district" value={newAddress.district} onChange={handleChange} placeholder="District" className="border p-2 rounded" required />
                  <input type="text" name="city" value={newAddress.city} onChange={handleChange} placeholder="City" className="border p-2 rounded" required />
                  <input type="text" name="street" value={newAddress.street} onChange={handleChange} placeholder="Street" className="border p-2 rounded" required />
                  <input type="text" name="building_name" value={newAddress.building_name} onChange={handleChange} placeholder="Building Name" className="border p-2 rounded" required />
                  <input type="text" name="pincode" value={newAddress.pincode} onChange={handleChange} placeholder="Pincode" className="border p-2 rounded" required />
                  <input type="text" name="phone_number" value={newAddress.phone_number} onChange={handleChange} placeholder="Phone Number" className="border p-2 rounded" required />
                </div>
                <div className="mt-4 flex justify-end">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-500 text-white px-4 py-2 rounded mr-2 hover:bg-gray-600">
                    Cancel
                  </button>
                  <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                    Add Address
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
  
        {/* Modal for editing address */}
        {isEditModalOpen && editAddress && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white p-6 rounded shadow-md w-full max-w-lg">
      <h3 className="text-xl font-semibold mb-4">Edit Address</h3>
      <form onSubmit={handleUpdateAddress}>
        <div className="grid grid-cols-1 gap-4">
          
          {/* Name Field */}
          <label className="block">
            <span className="text-gray-700">Name</span>
            <input 
              type="text" 
              name="name" 
              value={editAddress.name} 
              onChange={handleEditChange} 
              placeholder="Enter Name" 
              className="border p-2 rounded w-full mt-1" 
              required 
            />
          </label>

          {/* Country Dropdown */}
          <label className="block">
            <span className="text-gray-700">Country</span>
            <select 
              name="countryID" 
              value={editAddress.countryID || ""} 
              onChange={handleEditChange} 
              className="border p-2 rounded w-full mt-1" 
              required
            >
              <option value="">Select Country</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </label>

          {/* State Field */}
          <label className="block">
            <span className="text-gray-700">State</span>
            <input 
              type="text" 
              name="state" 
              value={editAddress.state} 
              onChange={handleEditChange} 
              placeholder="Enter State" 
              className="border p-2 rounded w-full mt-1" 
              required 
            />
          </label>

          {/* District Field */}
          <label className="block">
            <span className="text-gray-700">District</span>
            <input 
              type="text" 
              name="district" 
              value={editAddress.district} 
              onChange={handleEditChange} 
              placeholder="Enter District" 
              className="border p-2 rounded w-full mt-1" 
              required 
            />
          </label>

          {/* City Field */}
          <label className="block">
            <span className="text-gray-700">City</span>
            <input 
              type="text" 
              name="city" 
              value={editAddress.city} 
              onChange={handleEditChange} 
              placeholder="Enter City" 
              className="border p-2 rounded w-full mt-1" 
              required 
            />
          </label>

          {/* Street Field */}
          <label className="block">
            <span className="text-gray-700">Street</span>
            <input 
              type="text" 
              name="street" 
              value={editAddress.street} 
              onChange={handleEditChange} 
              placeholder="Enter Street" 
              className="border p-2 rounded w-full mt-1" 
              required 
            />
          </label>

          {/* Building Name Field */}
          <label className="block">
            <span className="text-gray-700">Building Name</span>
            <input 
              type="text" 
              name="building_name" 
              value={editAddress.building_name} 
              onChange={handleEditChange} 
              placeholder="Enter Building Name" 
              className="border p-2 rounded w-full mt-1" 
              required 
            />
          </label>

          {/* Pincode Field */}
          <label className="block">
            <span className="text-gray-700">Pincode</span>
            <input 
              type="text" 
              name="pincode" 
              value={editAddress.pincode} 
              onChange={handleEditChange} 
              placeholder="Enter Pincode" 
              className="border p-2 rounded w-full mt-1" 
              required 
            />
          </label>

          {/* Phone Number Field */}
          <label className="block">
            <span className="text-gray-700">Phone Number</span>
            <input 
              type="text" 
              name="phone_number" 
              value={editAddress.phone_number} 
              onChange={handleEditChange} 
              placeholder="Enter Phone Number" 
              className="border p-2 rounded w-full mt-1" 
              required 
            />
          </label>
          
        </div>

        {/* Buttons */}
        <div className="mt-4 flex justify-end">
          <button 
            type="button" 
            onClick={() => setIsEditModalOpen(false)} 
            className="bg-gray-500 text-white px-4 py-2 rounded mr-2 hover:bg-gray-600"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Update Address
          </button>
        </div>

      </form>
    </div>
  </div>
)}


        {/* Address Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {addresses.map((address) => (
          <div key={address.addressID} className="bg-white shadow-md p-4 rounded-lg border border-gray-300">
            <h3 className="text-lg font-semibold mb-2">{address.name}</h3>
            <p className="text-gray-700">
              {`${address.building_name}, ${address.street}, ${address.city}, ${address.district}, ${address.state}, ${address.country} - ${address.pincode}`}
            </p>
            <p className="text-gray-600 mt-2">Phone: {address.phone_number}</p>
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => openEditModal(address)}
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteAddress(address.addressID)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      </div>
    );
  };
  
  export default AddressPage;