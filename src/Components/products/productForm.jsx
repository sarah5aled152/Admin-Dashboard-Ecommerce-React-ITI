import { useState, useEffect } from "react";
import { Plus, X, Upload, Star } from "lucide-react";
import axios from "axios";
import { useAuth } from "../../Context/Auth.context";

const ProductForm = ({ product, onSubmit, onCancel }) => {
  const isEditMode = !!product;
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const { token } = useAuth(); // Fixed: Properly destructure token from useAuth

  const headers = {
    "Content-Type": "multipart/form-data",
    accesstoken: `accesstoken_${token}`, // Fixed: Use the token directly
  };

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categoryId: "",
    brandId: "",
    basePrice: "", // Fixed: Changed from baseprice to basePrice to match validation schema
    stock: "",
    discountType: "percentage",
    discountValue: "0",
    images: [],
  });

  // Store file objects for upload
  const [imageFiles, setImageFiles] = useState([]);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [uploading, setUploading] = useState(false);

  // Fetch categories and brands
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResponse, brandsResponse] = await Promise.all([
          axios.get("http://localhost:3000/category/"),
          axios.get("http://localhost:3000/brand/"),
        ]);
        setCategories(categoriesResponse.data.data || []);
        setBrands(brandsResponse.data.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setSubmitError(
          "Error loading categories and brands. Please refresh the page."
        );
      }
    };
    fetchData();
  }, []);

  // Populate form with product data if in edit mode
  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title || "",
        description: product.description || "",
        categoryId: product.category?._id || "",
        brandId: product.brand?._id || "",
        basePrice: product.basePrice || "", // Fixed: Consistent casing for basePrice
        stock: product.stock || "",
        discountType: product.discount?.type || "percentage",
        discountValue: product.discount?.value || "0",
        images: product.images || [],
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setFormData({ ...formData, [name]: newValue });
    setTouched({ ...touched, [name]: true });
    validateField(name, newValue);
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    setUploading(true);
    const files = Array.from(e.target.files);

    if (files.length === 0) {
      setUploading(false);
      return;
    }

    // Create temporary preview URLs for display
    const fileObjects = files.map((file) => ({
      _id: Date.now() + Math.random().toString(36).substring(2, 9), // Generate unique ID for preview
      secure_url: URL.createObjectURL(file),
      file: file, // Store the file object for later upload
    }));

    // Add new files to state
    setImageFiles([...imageFiles, ...files]);
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...fileObjects],
    }));

    // Clear the image error if it exists
    if (errors.images) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.images;
        return newErrors;
      });
    }

    setUploading(false);
  };

  const validateField = (name, value) => {
    let newErrors = { ...errors };
    switch (name) {
      case "title":
        if (!value) newErrors.title = "Product title is required";
        else if (value.length < 3)
          newErrors.title = "Title must be at least 3 characters long";
        else if (value.length > 100)
          newErrors.title = "Title cannot exceed 100 characters";
        else delete newErrors.title;
        break;
      case "basePrice": // Fixed: Changed from baseprice to basePrice
        if (!value) newErrors.basePrice = "Base price is required";
        else if (Number(value) <= 0)
          newErrors.basePrice = "Base price must be a positive number";
        else delete newErrors.basePrice;
        break;
      case "stock":
        if (value === "") newErrors.stock = "Stock quantity is required";
        else if (!Number.isInteger(Number(value)))
          newErrors.stock = "Stock must be a whole number";
        else if (Number(value) < 0)
          newErrors.stock = "Stock cannot be negative";
        else delete newErrors.stock;
        break;
      case "discountType":
        if (value !== "percentage" && value !== "fixed")
          newErrors.discountType =
            'Discount type must be either "percentage" or "fixed"';
        else delete newErrors.discountType;
        break;
      case "discountValue":
        if (Number(value) < 0)
          newErrors.discountValue = "Discount value cannot be negative";
        else if (formData.discountType === "percentage" && Number(value) > 100)
          newErrors.discountValue = "Discount percentage cannot exceed 100%";
        else delete newErrors.discountValue;
        break;
      case "description":
        if (!value) newErrors.description = "Product description is required";
        else if (value.length < 10)
          newErrors.description =
            "Description must be at least 10 characters long";
        else delete newErrors.description;
        break;
      case "categoryId":
        if (!value) newErrors.categoryId = "Category is required";
        else delete newErrors.categoryId;
        break;
      case "brandId":
        if (!value) newErrors.brandId = "Brand is required";
        else delete newErrors.brandId;
        break;
      default:
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    let newErrors = {};
    let newTouched = {};
    Object.keys(formData).forEach((key) => {
      newTouched[key] = true;
    });
    if (!formData.title) newErrors.title = "Product title is required";
    else if (formData.title.length < 3)
      newErrors.title = "Title must be at least 3 characters long";
    else if (formData.title.length > 100)
      newErrors.title = "Title cannot exceed 100 characters";
    if (!formData.basePrice)
      newErrors.basePrice =
        "Base price is required"; // Fixed: Consistent naming
    else if (Number(formData.basePrice) <= 0)
      newErrors.basePrice = "Base price must be a positive number";
    if (formData.stock === "") newErrors.stock = "Stock quantity is required";
    else if (!Number.isInteger(Number(formData.stock)))
      newErrors.stock = "Stock must be a whole number";
    else if (Number(formData.stock) < 0)
      newErrors.stock = "Stock cannot be negative";
    if (Number(formData.discountValue) < 0)
      newErrors.discountValue = "Discount value cannot be negative";
    else if (
      formData.discountType === "percentage" &&
      Number(formData.discountValue) > 100
    )
      newErrors.discountValue = "Discount percentage cannot exceed 100%";
    if (!formData.description)
      newErrors.description = "Product description is required";
    else if (formData.description.length < 10)
      newErrors.description = "Description must be at least 10 characters long";
    if (!formData.categoryId) newErrors.categoryId = "Category is required";
    if (!formData.brandId) newErrors.brandId = "Brand is required";

    // Validate images only if not in edit mode or if existing images were removed
    if (
      (!isEditMode || (isEditMode && formData.images.length === 0)) &&
      imageFiles.length === 0
    ) {
      newErrors.images = "At least one product image is required";
    }

    setTouched(newTouched);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRemoveImage = (imageId) => {
    // Remove from formData.images
    const updatedImages = formData.images.filter((img) => img._id !== imageId);

    // If it's a new image (with file property), also remove from imageFiles
    const removedImage = formData.images.find((img) => img._id === imageId);
    if (removedImage && removedImage.file) {
      const updatedImageFiles = imageFiles.filter(
        (file) =>
          !formData.images.find(
            (img) => img._id === imageId && img.file === file
          )
      );
      setImageFiles(updatedImageFiles);
    }

    setFormData({ ...formData, images: updatedImages });

    // Set error if no images left
    if (updatedImages.length === 0) {
      setErrors({
        ...errors,
        images: "At least one product image is required",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = validateForm();
    if (!isValid) {
      const firstErrorField = document.querySelector(".error-message");
      if (firstErrorField)
        firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const productData = new FormData();

      // Add text fields to FormData
      Object.keys(formData).forEach((key) => {
        if (key !== "images") {
          // Fixed: Convert basePrice to baseprice for API compatibility
          if (key === "basePrice") {
            productData.append("baseprice", formData[key]);
          } else {
            productData.append(key, formData[key]);
          }
        }
      });

      // Add images to FormData
      if (isEditMode) {
        // For edit mode, we need to handle both existing and new images
        // For existing images that were not created in this session
        formData.images.forEach((image) => {
          if (!image.file && image.public_id) {
            // This is an existing image from the server
            productData.append(
              "existingImages",
              JSON.stringify({
                _id: image._id,
                public_id: image.public_id,
                secure_url: image.secure_url,
              })
            );
          }
        });

        // Add new files
        imageFiles.forEach((file) => {
          productData.append("files", file);
        });

        // If editing an image, pass the oldPublicId
        if (formData.oldPublicId) {
          productData.append("oldPublicId", formData.oldPublicId);
        }
      } else {
        // For create mode, just add all files
        imageFiles.forEach((file) => {
          productData.append("files", file);
        });
      }

      let response;
      if (isEditMode) {
        response = await axios.put(
          `http://localhost:3000/product/${product._id}`,
          productData,
          { headers }
        );
      } else {
        response = await axios.post(
          `http://localhost:3000/product/${formData.categoryId}/${formData.brandId}`,
          productData,
          { headers }
        );
      }

      setSubmitSuccess(
        isEditMode
          ? "Product updated successfully!"
          : "Product created successfully!"
      );

      if (onSubmit) onSubmit(response.data.data);
    } catch (error) {
      console.error("Error submitting product:", error);
      console.log("Error response data:", error.response?.data);
      setSubmitError(
        error.response?.data?.error_message ||
          "An error occurred while saving the product. Please try again."
      );
    } finally {
      setIsSubmitting(false); // Fixed: Set isSubmitting to false in finally block to ensure it's reset even on error
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({ ...touched, [name]: true });
    validateField(name, formData[name]);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
      <h2 className="text-xl text-black font-semibold mb-6">
        {isEditMode ? "Update Product" : "Product Upload"}
      </h2>
      <form onSubmit={handleSubmit}>
        {/* Breadcrumbs */}
        <div className="flex items-center text-gray-500 text-sm mb-6">
          <a href="#" className="hover:text-blue-600">
            Dashboard
          </a>
          <span className="mx-2">/</span>
          <a href="#" className="hover:text-blue-600">
            Products
          </a>
          <span className="mx-2">/</span>
          <span className="text-gray-700">
            {isEditMode ? "Product Update" : "Product Upload"}
          </span>
        </div>

        {/* Submit status messages */}
        {submitError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{submitError}</p>
          </div>
        )}
        {submitSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p>{submitSuccess}</p>
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
          <h3 className="text-lg text-black font-medium mb-6">
            Basic Information
          </h3>
          <div className="mb-4">
            <label className="block text-gray-700 uppercase text-xs font-medium mb-2">
              Product Name
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-3 py-2 border ${
                touched.title && errors.title
                  ? "border-red-500"
                  : "border-gray-300"
              } rounded-md focus:outline-none text-black focus:ring-2 focus:ring-blue-500`}
            />
            {touched.title && errors.title && (
              <p className="text-red-500 text-xs mt-1 error-message">
                {errors.title}
              </p>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 uppercase text-xs font-medium mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              onBlur={handleBlur}
              rows="5"
              className={`w-full px-3 py-2 border ${
                touched.description && errors.description
                  ? "border-red-500"
                  : "border-gray-300"
              } rounded-md focus:outline-none  text-black focus:ring-2 focus:ring-blue-500`}
            />
            {touched.description && errors.description && (
              <p className="text-red-500 text-xs mt-1 error-message">
                {errors.description}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 uppercase text-xs font-medium mb-2">
                Category
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-3 py-2 border ${
                  touched.categoryId && errors.categoryId
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md focus:outline-none  text-black focus:ring-2 focus:ring-blue-500`}
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {touched.categoryId && errors.categoryId && (
                <p className="text-red-500 text-xs mt-1 error-message">
                  {errors.categoryId}
                </p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 uppercase text-xs font-medium mb-2">
                Brand
              </label>
              <select
                name="brandId"
                value={formData.brandId}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-3 py-2 border ${
                  touched.brandId && errors.brandId
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md focus:outline-none text-black focus:ring-2 focus:ring-blue-500`}
              >
                <option value="">Select Brand</option>
                {brands.map((brand) => (
                  <option key={brand._id} value={brand._id}>
                    {brand.name}
                  </option>
                ))}
              </select>
              {touched.brandId && errors.brandId && (
                <p className="text-red-500 text-xs mt-1 error-message">
                  {errors.brandId}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 uppercase text-xs font-medium mb-2">
                Price
              </label>
              <input
                type="number"
                name="basePrice" // Fixed: Consistent naming
                value={formData.basePrice}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-3 py-2 border ${
                  touched.basePrice && errors.basePrice
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md focus:outline-none  text-black focus:ring-2 focus:ring-blue-500`}
              />
              {touched.basePrice && errors.basePrice && (
                <p className="text-red-500 text-xs mt-1 error-message">
                  {errors.basePrice}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 uppercase text-xs font-medium mb-2">
                Product Stock
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-3 py-2 border ${
                  touched.stock && errors.stock
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md focus:outline-none text-black focus:ring-2 focus:ring-blue-500`}
              />
              {touched.stock && errors.stock && (
                <p className="text-red-500 text-xs mt-1 error-message">
                  {errors.stock}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 uppercase text-xs font-medium mb-2">
                Discount Type
              </label>
              <select
                name="discountType"
                value={formData.discountType}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-3 py-2 border ${
                  touched.discountType && errors.discountType
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md focus:outline-none text-black focus:ring-2 focus:ring-blue-500`}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount</option>
              </select>
              {touched.discountType && errors.discountType && (
                <p className="text-red-500 text-xs mt-1 error-message">
                  {errors.discountType}
                </p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 uppercase text-xs font-medium mb-2">
                Discount Value{" "}
                {formData.discountType === "percentage" ? "(%)" : ""}
              </label>
              <input
                type="number"
                name="discountValue"
                value={formData.discountValue}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-3 py-2 border ${
                  touched.discountValue && errors.discountValue
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md focus:outline-none text-black focus:ring-2 focus:ring-blue-500`}
              />
              {touched.discountValue && errors.discountValue && (
                <p className="text-red-500 text-xs mt-1 error-message">
                  {errors.discountValue}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Media and Published */}
        <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
          <h3 className="text-lg font-medium text-black mb-6">
            Media And Published
          </h3>
          <div className="flex flex-wrap gap-4 mb-2">
            {formData.images.map((image) => (
              <div
                key={image._id}
                className="relative border border-gray-200 rounded-md w-24 h-24"
              >
                <img
                  src={image.secure_url}
                  alt="Product"
                  className="w-full h-full object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(image._id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <label
              className={`border border-dashed ${
                errors.images ? "border-red-500" : "border-gray-300"
              } rounded-md w-24 h-24 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50`}
            >
              <div className="text-center">
                <Upload
                  className={`w-8 h-8 mx-auto ${
                    errors.images ? "text-red-400" : "text-gray-400"
                  }`}
                />
                <span
                  className={`text-xs ${
                    errors.images ? "text-red-500" : "text-gray-500"
                  }`}
                >
                  {uploading ? "Uploading..." : "Image upload"}
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploading}
                multiple
              />
            </label>
          </div>
          {errors.images && (
            <p className="text-red-500 text-xs mb-4 error-message">
              {errors.images}
            </p>
          )}
          <div className="flex gap-4 mt-6">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-md hover:bg-gray-300"
              >
                CANCEL
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 flex items-center justify-center ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? (
                <span>Processing...</span>
              ) : (
                <>
                  <Upload className="mr-2" size={18} />
                  {isEditMode ? "UPDATE AND VIEW" : "PUBLISH AND VIEW"}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
