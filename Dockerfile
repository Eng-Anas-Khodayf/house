# Use a slim version of Python 3 as the base image
FROM python:3.9-slim

# Install the missing library
RUN apt-get update && apt-get install -y libgomp1

# Set the working directory in the container
WORKDIR /app

# Copy the pre-downloaded LightGBM wheel file (if needed) and other dependencies
# Note: If lightgbm is a large file, you might need to manually download it and install it
# like we did with xgboost in the previous project.
COPY requirements.txt .

# Install the Python dependencies
RUN pip install --no-cache-dir --default-timeout=100 -r requirements.txt


# Copy the entire project directory into the container
# This includes app.py, models/, and templates/
COPY . .

# Set environment port
ENV PORT=5005

# Expose port 5005 for the Flask application
EXPOSE 5005

# Define the command to run the application
CMD ["python", "app.py"]