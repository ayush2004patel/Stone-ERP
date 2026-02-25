# Generate gate pass book.py:

# Copyright (c) 2025, Dharmesh Rathod and contributors
# For license information, please see license.txt

# import frappe
# from frappe.model.document import Document


# class GenerateGatePassBooks(Document):
# 	pass

# import frappe
# from frappe.model.document import Document

# class GenerateGatePassBooks(Document):
#   """Controller for the Generate Gate Pass Books DocType"""

#   def validate(self):
#     """
#     This method is triggered when the document is saved.
#     It creates Gate Pass Books and their corresponding Gate Passes.
#     """
#     # Run this logic only when creating a new document to prevent it from
#     # running again on subsequent saves.
#     if self.is_new():
#       self.generate_books_and_passes()

#   def generate_books_and_passes(self):
#     """
#     The core logic to generate records.
#     """
#     # Get the quantities from the fields in the current document
#     num_books = self.quantity_of_gate_pass_books
#     num_passes_per_book = self.quantity_of_gate_passes

#     # Check if values are provided
#     if not num_books or not num_passes_per_book:
#       frappe.throw("Please specify both the 'Quantity of Gate Pass Books' and the 'Quantity of Gate Passes'.")

#     # The main loop to create the specified number of books
#     for _ in range(num_books):
#       # 1. Create the parent 'Gate Pass Book' document
#       new_book = frappe.new_doc("Gate Pass Book")
#       new_book.page_limit = num_passes_per_book
#       # The 'gate_pass_bookno' is set automatically by your naming rule
#       new_book.insert()

#       # A nested loop to create the child 'Gate Pass' documents for each book
#       for _ in range(num_passes_per_book):
#         # 2. Create the child 'Gate Pass' document
#         new_pass = frappe.new_doc("Gate Pass")
#         # 3. Link the child to its newly created parent book
#         new_pass.gate_pass_book_no = new_book.name
#         # The 'gate_pass_no' is also set automatically by its naming rule
#         new_pass.insert()

#     # Commit all the database changes at once
#     frappe.db.commit()

#     # Show a success message to the user in the UI 
#     frappe.msgprint(f"Successfully generated {num_books} Gate Pass Books, each with {num_passes_per_book} passes.")

##################################################################################
# Previous version of the code (commented out for reference)
##################################################################################
# import frappe
# from frappe.model.document import Document

# class GenerateGatePassBooks(Document):
#   """Controller for the Generate Gate Pass Books DocType"""

#   def validate(self):
#     """
#     This method is triggered when the document is saved.
#     """
#     if self.is_new():
#       self.generate_books_and_passes()

#   def generate_books_and_passes(self):
#     """
#     The core logic to generate records with resetting page numbers.
#     """
#     num_books = self.quantity_of_gate_pass_books
#     num_passes_per_book = self.quantity_of_gate_passes

#     if not num_books or not num_passes_per_book:
#       frappe.throw("Please specify both the 'Quantity of Gate Pass Books' and the 'Quantity of Gate Passes'.")

#     # The main loop to create the specified number of books
#     for _ in range(num_books):
#       # 1. Create the parent 'Gate Pass Book' document
#       new_book = frappe.new_doc("Gate Pass Book")
#       new_book.page_limit = num_passes_per_book
#       new_book.insert()

#       # A nested loop to create the child 'Gate Pass' documents
#       # We use 'page_index' to count from 0 to (n-1)
#       for page_index in range(num_passes_per_book):
#         # We add 1 to the index to get a 1-based page number (1, 2, 3...)
#         page_number = page_index + 1

#         # 2. **Construct the new unique name** (e.g., "GPBNO-0001-1")
#         new_pass_name = f"{new_book.name}-{page_number}"

#         # 3. Create the child 'Gate Pass' document
#         new_pass = frappe.new_doc("Gate Pass")
#         new_pass.gate_pass_book_no = new_book.name  # Link to the parent book
#         new_pass.gate_pass_no = new_pass_name     # Set the unique name we just built
#         new_pass.insert()

#     # Commit all the database changes
#     frappe.db.commit()

#     # Show a success message to the user 
#     frappe.msgprint(f"Successfully generated {num_books} Gate Pass Books with correctly numbered passes.")

##################################################################################
# Even older version of the code (commented out for reference)
##################################################################################
# import frappe
# from frappe.model.document import Document

# class GenerateGatePassBooks(Document):
#   """Controller for the Generate Gate Pass Books DocType"""

#   def validate(self):
#     if self.is_new():
#       self.generate_books_and_passes()

#   def generate_books_and_passes(self):
#     num_books = self.quantity_of_gate_pass_books
#     num_passes_per_book = self.quantity_of_gate_passes

#     if not num_books or not num_passes_per_book:
#       frappe.throw("Please specify both the 'Quantity of Gate Pass Books' and the 'Quantity of Gate Passes'.")

#     for _ in range(num_books):
#       # Create the parent book
#       new_book = frappe.new_doc("Gate Pass Book")
#       new_book.page_limit = num_passes_per_book
#       new_book.insert()

#       # Create the child passes for this book
#       for page_index in range(num_passes_per_book):
#         page_number = page_index + 1

#         # 1. Create the unique SYSTEM ID (e.g., "GPBNO-0001-1")
#         # This is assigned to the 'name' field, which is 'gate_pass_no'.
#         unique_system_name = f"{new_book.name}-{page_number}"

#         # 2. Create the clean DISPLAY number (e.g., "GPNO-0001")
#         # The zfill(4) function adds leading zeros to the number.
#         display_number = f"GPNO-{str(page_number).zfill(4)}"

#         # 3. Create and save the new Gate Pass document
#         new_pass = frappe.new_doc("Gate Pass")
#         new_pass.gate_pass_book_no = new_book.name  # Link to parent

#         # Assign the unique name to the primary key field
#         new_pass.gate_pass_no = unique_system_name

#         # Assign the clean, repeating number to our new display field
#         new_pass.gate_pass_display_no = display_number

#         new_pass.insert()

#     frappe.db.commit()
#     frappe.msgprint(f"Successfully generated {num_books} Gate Pass Books, each with {num_passes_per_book} passes.")

##################################################################################
# Even older version of the code (commented out for reference)
##################################################################################

# import frappe
# from frappe.model.document import Document

# class GenerateGatePassBooks(Document):
#   """Controller for the Generate Gate Pass Books DocType"""

#   def validate(self):
#     if self.is_new():
#       self.generate_books_and_passes()

#   def generate_books_and_passes(self):
#     num_books = self.quantity_of_gate_pass_books
#     num_passes_per_book = self.quantity_of_gate_passes

#     if not num_books or not num_passes_per_book:
#       frappe.throw("Please specify both the 'Quantity of Gate Pass Books' and the 'Quantity of Gate Passes'.")

#     for _ in range(num_books):
#       # Create the parent book
#       new_book = frappe.new_doc("Gate Pass Book")
#       new_book.total_pages = num_passes_per_book
#       new_book.insert()

#       # Create the child passes for this book
#       for page_index in range(num_passes_per_book):
#         page_number = page_index + 1

#         # 1. Create the unique SYSTEM ID (e.g., "GPNO-0003-5")
#         # This is assigned to the 'name' field, which is 'gate_pass_no'.
#         # We replace "GPBNO" from the book's name with "GPNO".
#         unique_system_name = f"{new_book.name.replace('GPBNO', 'GPNO')}-{page_number}"

#         # 2. Create the clean DISPLAY number (e.g., "GPNO-0001")
#         # The zfill(4) function adds leading zeros to the number.
#         display_number = f"GPNO-{str(page_number).zfill(4)}"

#         # 3. Create and save the new Gate Pass document
#         new_pass = frappe.new_doc("Gate Pass")
#         new_pass.gate_pass_book_no = new_book.name  # Link to parent

#         # Assign the unique name to the primary key field
#         new_pass.gate_pass_no = unique_system_name

#         # Assign the clean, repeating number to our new display field
#         new_pass.gate_pass_display_no = display_number

#         new_pass.insert()

#     frappe.db.commit()
#     frappe.msgprint(f"Successfully generated {num_books} Gate Pass Books, each with {num_passes_per_book} passes.")

####the upper code is fully functional and no need to change anything(only physical gate pass book referance is missing )##########




####################################################################
#below is the code with physical gate pass book referance added
####################################################################
# import frappe
# from frappe.model.document import Document

# class GenerateGatePassBooks(Document):
#     """
#     Controller for the 'Generate Gate Pass Books' DocType.
#     This script runs on 'validate' when the document is new.
#     """

#     def validate(self):
#         if self.is_new() and self.status == "Draft":
#             self.generate_books_and_passes()
#             self.status = "Completed"

#     def generate_books_and_passes(self):
#         num_books = self.quantity_of_gate_pass_books
#         num_passes_per_book = self.quantity_of_gate_passes
#         series_prefix = self.physical_book_series

#         if not num_books or not num_passes_per_book or not series_prefix:
#             frappe.throw("Please specify 'Physical Book Series', 'Quantity of Books', and 'Quantity of Passes'.")

#         current_book_count = frappe.db.count("Gate Pass Book")
        
#         # Add a counter for accurate reporting
#         successful_books = 0
        
#         for i in range(num_books):
#             book_index = i + 1
#             internal_book_index = current_book_count + book_index

#             physical_book_id = f"{series_prefix}{str(book_index).zfill(3)}"
#             internal_system_book_id = f"GPB-{str(internal_book_index).zfill(4)}"

#             try:
#                 # 3. Create the parent book (Gate Pass Book)
#                 new_book = frappe.new_doc("Gate Pass Book")
                
#                 new_book.gate_pass_book_display_no = physical_book_id
#                 new_book.gate_pass_book_no = internal_system_book_id
#                 new_book.total_pages = num_passes_per_book
#                 new_book.remaining_passes = num_passes_per_book 
#                 new_book.status = "Available" 
                
#                 # --- !! THE FIX IS HERE !! ---
#                 # We only call insert() ONCE
#                 new_book.insert(ignore_permissions=True) 

#                 # 4. Create all the child passes (Gate Pass pages)
#                 for page_index in range(num_passes_per_book):
#                     page_number = page_index + 1

#                     physical_page_id = f"{physical_book_id}-{str(page_number).zfill(2)}"
#                     internal_system_page_id = f"{internal_system_book_id}-{page_number}"

#                     new_pass = frappe.new_doc("Gate Pass")
                    
#                     new_pass.gate_pass_display_no = physical_page_id
#                     new_pass.gate_pass_no = internal_system_page_id
#                     new_pass.gate_pass_book_no = new_book.name 
#                     new_pass.status = "Available"
                    
#                     new_pass.insert(ignore_permissions=True)

#                 # If we get here, the book AND its pages were created
#                 successful_books += 1

#             except frappe.exceptions.DuplicateEntryError:
#                 frappe.msgprint(f"A book with Physical ID {physical_book_id} already exists. Skipping.")
#             except Exception as e:
#                 frappe.log_error(frappe.get_traceback(), "Gate Pass Generation Failed")

#         # Use the new counter for an accurate message
#         frappe.msgprint(f"Successfully generated {successful_books} of {num_books} requested Gate Pass Books.")

####################################################################
#last working version with physical gate pass book referance added
############
# import frappe
# from frappe.model.document import Document

# class GenerateGatePassBooks(Document):
#     """
#     Controller for the 'Generate Gate Pass Books' DocType.
#     This script runs on 'validate' when the document is new.
#     """

#     def validate(self):
#         if self.is_new() and self.status == "Draft":
#             self.generate_books_and_passes()
#             self.status = "Completed"

#     def generate_books_and_passes(self):
#         # Parse the range input (now a Data field)
#         range_input = self.range_of_gate_pass_books
#         num_passes_per_book = self.quantity_of_gate_passes
#         series_prefix = self.physical_book_series

#         if not range_input or not num_passes_per_book or not series_prefix:
#             frappe.throw("Please specify 'Physical Book Series', 'Range of Gate Pass Books', and 'Quantity of Passes'.")

#         # Parse the range string to get book numbers
#         book_numbers = self.parse_range_input(str(range_input))
        
#         if not book_numbers:
#             frappe.throw("Invalid range format. Please use format like: 1-10, 1-10,15, etc.")

#         current_book_count = frappe.db.count("Gate Pass Book")
        
#         # Add a counter for accurate reporting
#         successful_books = 0
        
#         for book_number in book_numbers:
#             # Calculate internal book index based on existing books
#             internal_book_index = current_book_count + successful_books + 1

#             physical_book_id = f"{series_prefix}{str(book_number).zfill(3)}"
#             internal_system_book_id = f"GPB-{str(internal_book_index).zfill(4)}"

#             try:
#                 # Check if book already exists
#                 existing_book = frappe.db.exists("Gate Pass Book", {
#                     "gate_pass_book_display_no": physical_book_id
#                 })
                
#                 if existing_book:
#                     frappe.msgprint(f"A book with Physical ID {physical_book_id} already exists. Skipping.")
#                     continue

#                 # 3. Create the parent book (Gate Pass Book)
#                 new_book = frappe.new_doc("Gate Pass Book")
                
#                 new_book.gate_pass_book_display_no = physical_book_id
#                 new_book.gate_pass_book_no = internal_system_book_id
#                 new_book.total_pages = num_passes_per_book
#                 new_book.remaining_passes = num_passes_per_book 
#                 new_book.status = "Available" 
                
#                 # Insert the book
#                 new_book.insert(ignore_permissions=True) 

#                 # 4. Create all the child passes (Gate Pass pages)
#                 for page_index in range(num_passes_per_book):
#                     page_number = page_index + 1

#                     physical_page_id = f"{physical_book_id}-{str(page_number).zfill(2)}"
#                     internal_system_page_id = f"{internal_book_index}-{page_number}"

#                     new_pass = frappe.new_doc("Gate Pass")
                    
#                     new_pass.gate_pass_display_no = physical_page_id
#                     new_pass.gate_pass_no = internal_system_page_id
#                     new_pass.gate_pass_book_no = new_book.name 
#                     new_pass.status = "Available"
                    
#                     new_pass.insert(ignore_permissions=True)

#                 # If we get here, the book AND its pages were created
#                 successful_books += 1

#             except frappe.exceptions.DuplicateEntryError:
#                 frappe.msgprint(f"A book with Physical ID {physical_book_id} already exists. Skipping.")
#             except Exception as e:
#                 frappe.log_error(frappe.get_traceback(), f"Gate Pass Generation Failed for book {book_number}")
#                 frappe.throw(f"Error generating book {book_number}: {str(e)}")

#         # Use the new counter for an accurate message
#         frappe.msgprint(f"Successfully generated {successful_books} of {len(book_numbers)} requested Gate Pass Books.")

#     def parse_range_input(self, range_string):
#         """
#         Parse range input string like:
#         "1-10" -> [1,2,3,4,5,6,7,8,9,10]
#         "1,10" -> [1,10] 
#         "1-10,15" -> [1,2,3,4,5,6,7,8,9,10,15]
#         "1-3,7-9,12" -> [1,2,3,7,8,9,12]
#         """
#         if not range_string:
#             return []
        
#         # Remove spaces and split by comma
#         range_parts = [part.strip() for part in range_string.split(',')]
#         result = []
        
#         for part in range_parts:
#             if '-' in part:
#                 # Handle range like "1-10"
#                 try:
#                     start, end = map(int, part.split('-'))
#                     if start <= end:
#                         result.extend(range(start, end + 1))
#                     else:
#                         # If start > end, just add the start number
#                         result.append(start)
#                 except ValueError:
#                     frappe.throw(f"Invalid range format: {part}. Use format like 'start-end'.")
#             else:
#                 # Handle single number like "15"
#                 try:
#                     number = int(part)
#                     result.append(number)
#                 except ValueError:
#                     frappe.throw(f"Invalid number: {part}. Use integers only.")
        
#         # Remove duplicates while preserving order
#         unique_result = []
#         for item in result:
#             if item not in unique_result:
#                 unique_result.append(item)
        
#         # Sort the result
#         unique_result.sort()
        
#         return unique_result

############################################################################
# Final working version with physical gate pass book referance added
############################################################################

# import frappe
# from frappe.model.document import Document

# class GenerateGatePassBooks(Document):
#     """
#     Controller for the 'Generate Gate Pass Books' DocType.
#     This script runs on 'validate' when the document is new.
#     """

#     def validate(self):
#         if self.is_new() and self.status == "Draft":
#             self.generate_books_and_passes()
#             self.status = "Completed"

#     def generate_books_and_passes(self):
#         # Parse the range input (now a Data field)
#         range_input = self.range_of_gate_pass_books
#         num_passes_per_book = self.quantity_of_gate_passes
#         series_prefix = self.physical_book_series  # This is now optional

#         if not range_input or not num_passes_per_book:
#             frappe.throw("Please specify 'Range of Gate Pass Books' and 'Quantity of Passes'.")

#         # Parse the range string to get book numbers
#         book_numbers = self.parse_range_input(str(range_input))
        
#         if not book_numbers:
#             frappe.throw("Invalid range format. Please use format like: 1-10, 1-10,15, etc.")

#         # Get the next available system ID by finding max gate_pass_bookno
#         last_book = frappe.db.sql("""
#             SELECT MAX(CAST(SUBSTRING(gate_pass_bookno, 5) AS UNSIGNED)) as max_num 
#             FROM `tabGate Pass Book` 
#             WHERE gate_pass_bookno LIKE 'GPB-%'
#         """, as_dict=True)

#         next_system_id_num = 1
#         if last_book and last_book[0].max_num:
#             next_system_id_num = last_book[0].max_num + 1

#         # Add a counter for accurate reporting
#         successful_books = 0
        
#         for book_number in book_numbers:
#             # Generate physical book ID based on whether series prefix exists
#             if series_prefix:
#                 physical_book_id = f"{series_prefix}{str(book_number).zfill(3)}"
#             else:
#                 physical_book_id = str(book_number).zfill(3)  # Just the number with padding if no prefix

#             # Generate internal system ID (GPB-XXXX format) - guaranteed unique
#             internal_system_book_id = f"GPB-{str(next_system_id_num).zfill(4)}"
#             next_system_id_num += 1  # Increment for next book

#             try:
#                 # Check if book already exists with this display number
#                 existing_book = frappe.db.exists("Gate Pass Book", {
#                     "gate_pass_book_display_no": physical_book_id
#                 })
                
#                 if existing_book:
#                     frappe.msgprint(f"A book with Physical ID {physical_book_id} already exists. Skipping.")
#                     continue

#                 # 3. Create the parent book (Gate Pass Book)
#                 new_book = frappe.new_doc("Gate Pass Book")
                
#                 new_book.gate_pass_book_display_no = physical_book_id
#                 new_book.gate_pass_bookno = internal_system_book_id  # Set the system ID field
#                 new_book.total_pages = num_passes_per_book
#                 new_book.remaining_passes = num_passes_per_book 
#                 new_book.status = "Available" 
                
#                 # Insert the book
#                 new_book.insert(ignore_permissions=True) 

#                 # 4. Create all the child passes (Gate Pass pages)
#                 for page_index in range(num_passes_per_book):
#                     page_number = page_index + 1

#                     # Generate page display ID based on whether series prefix exists
#                     if series_prefix:
#                         physical_page_id = f"{series_prefix}{str(book_number).zfill(3)}-{str(page_number).zfill(2)}"
#                     else:
#                         physical_page_id = f"{str(book_number).zfill(3)}-{str(page_number).zfill(2)}"

#                     # Use internal book ID for the page
#                     internal_system_page_id = f"{internal_system_book_id}-{page_number}"

#                     new_pass = frappe.new_doc("Gate Pass")
                    
#                     new_pass.gate_pass_display_no = physical_page_id
#                     new_pass.gate_pass_no = internal_system_page_id
#                     new_pass.gate_pass_book_no = new_book.name 
#                     new_pass.status = "Available"
                    
#                     new_pass.insert(ignore_permissions=True)

#                 # If we get here, the book AND its pages were created
#                 successful_books += 1

#             except frappe.exceptions.DuplicateEntryError:
#                 frappe.msgprint(f"A book with Physical ID {physical_book_id} already exists. Skipping.")
#             except Exception as e:
#                 frappe.log_error(frappe.get_traceback(), f"Gate Pass Generation Failed for book {book_number}")
#                 frappe.throw(f"Error generating book {book_number}: {str(e)}")

#         # Use the new counter for an accurate message
#         frappe.msgprint(f"Successfully generated {successful_books} of {len(book_numbers)} requested Gate Pass Books.")

#     def parse_range_input(self, range_string):
#         """
#         Parse range input string like:
#         "1-10" -> [1,2,3,4,5,6,7,8,9,10]
#         "1,10" -> [1,10] 
#         "1-10,15" -> [1,2,3,4,5,6,7,8,9,10,15]
#         "1-3,7-9,12" -> [1,2,3,7,8,9,12]
#         """
#         if not range_string:
#             return []
        
#         # Remove spaces and split by comma
#         range_parts = [part.strip() for part in range_string.split(',')]
#         result = []
        
#         for part in range_parts:
#             if '-' in part:
#                 # Handle range like "1-10"
#                 try:
#                     start, end = map(int, part.split('-'))
#                     if start <= end:
#                         result.extend(range(start, end + 1))
#                     else:
#                         # If start > end, just add the start number
#                         result.append(start)
#                 except ValueError:
#                     frappe.throw(f"Invalid range format: {part}. Use format like 'start-end'.")
#             else:
#                 # Handle single number like "15"
#                 try:
#                     number = int(part)
#                     result.append(number)
#                 except ValueError:
#                     frappe.throw(f"Invalid number: {part}. Use integers only.")
        
#         # Remove duplicates while preserving order
#         unique_result = []
#         for item in result:
#             if item not in unique_result:
#                 unique_result.append(item)
        
#         # Sort the result
#         unique_result.sort()
        
#         return unique_result

#########################################################################
# Final working version with physical gate pass book referance and last generated book field added down
#########################################################################
#19Nov_3;41pm
# import frappe
# from frappe.model.document import Document

# class GenerateGatePassBooks(Document):
#     """
#     Controller for the 'Generate Gate Pass Books' DocType.
#     This script runs on 'validate' when the document is new.
#     """

#     def validate(self):
#         if self.is_new() and self.status == "Draft":
#             self.generate_books_and_passes()
#             self.status = "Completed"

#     def generate_books_and_passes(self):
#         # Parse the range input (now a Data field)
#         range_input = self.range_of_gate_pass_books
#         num_passes_per_book = self.quantity_of_gate_passes
#         series_prefix = self.physical_book_series  # This is now optional

#         if not range_input or not num_passes_per_book:
#             frappe.throw("Please specify 'Range of Gate Pass Books' and 'Quantity of Passes'.")

#         # Parse the range string to get book numbers
#         book_numbers = self.parse_range_input(str(range_input))
        
#         if not book_numbers:
#             frappe.throw("Invalid range format. Please use format like: 1-10, 1-10,15, etc.")

#         # Get the next available system ID by finding max gate_pass_bookno
#         last_book = frappe.db.sql("""
#             SELECT MAX(CAST(SUBSTRING(gate_pass_bookno, 5) AS UNSIGNED)) as max_num 
#             FROM `tabGate Pass Book` 
#             WHERE gate_pass_bookno LIKE 'GPB-%'
#         """, as_dict=True)

#         next_system_id_num = 1
#         if last_book and last_book[0].max_num:
#             next_system_id_num = last_book[0].max_num + 1

#         # Add a counter for accurate reporting
#         successful_books = 0
#         last_generated_book_display_no = None  # Track the last generated book
        
#         for book_number in book_numbers:
#             # Generate physical book ID based on whether series prefix exists
#             if series_prefix:
#                 physical_book_id = f"{series_prefix}{str(book_number).zfill(3)}"
#             else:
#                 physical_book_id = str(book_number).zfill(3)  # Just the number with padding if no prefix

#             # Generate internal system ID (GPB-XXXX format) - guaranteed unique
#             internal_system_book_id = f"GPB-{str(next_system_id_num).zfill(4)}"
#             next_system_id_num += 1  # Increment for next book

#             try:
#                 # Check if book already exists with this display number
#                 existing_book = frappe.db.exists("Gate Pass Book", {
#                     "gate_pass_book_display_no": physical_book_id
#                 })
                
#                 if existing_book:
#                     frappe.msgprint(f"A book with Physical ID {physical_book_id} already exists. Skipping.")
#                     continue

#                 # 3. Create the parent book (Gate Pass Book)
#                 new_book = frappe.new_doc("Gate Pass Book")
                
#                 new_book.gate_pass_book_display_no = physical_book_id
#                 new_book.gate_pass_bookno = internal_system_book_id  # Set the system ID field
#                 new_book.total_pages = num_passes_per_book
#                 new_book.remaining_passes = num_passes_per_book 
#                 new_book.status = "Available" 
                
#                 # Insert the book
#                 new_book.insert(ignore_permissions=True) 

#                 # 4. Create all the child passes (Gate Pass pages)
#                 for page_index in range(num_passes_per_book):
#                     page_number = page_index + 1

#                     # Generate page display ID based on whether series prefix exists
#                     if series_prefix:
#                         physical_page_id = f"{series_prefix}{str(book_number).zfill(3)}-{str(page_number).zfill(2)}"
#                     else:
#                         physical_page_id = f"{str(book_number).zfill(3)}-{str(page_number).zfill(2)}"

#                     # Use internal book ID for the page
#                     internal_system_page_id = f"{internal_system_book_id}-{page_number}"

#                     new_pass = frappe.new_doc("Gate Pass")
                    
#                     new_pass.gate_pass_display_no = physical_page_id
#                     new_pass.gate_pass_no = internal_system_page_id
#                     new_pass.gate_pass_book_no = new_book.name 
#                     new_pass.status = "Available"
                    
#                     new_pass.insert(ignore_permissions=True)

#                 # If we get here, the book AND its pages were created
#                 successful_books += 1
#                 last_generated_book_display_no = physical_book_id  # Update the last generated book

#             except frappe.exceptions.DuplicateEntryError:
#                 frappe.msgprint(f"A book with Physical ID {physical_book_id} already exists. Skipping.")
#             except Exception as e:
#                 frappe.log_error(frappe.get_traceback(), f"Gate Pass Generation Failed for book {book_number}")
#                 frappe.throw(f"Error generating book {book_number}: {str(e)}")

#         # Set the last generated book field after all books are created
#         if last_generated_book_display_no:
#             self.last_generated_book = last_generated_book_display_no

#         # Use the new counter for an accurate message
#         frappe.msgprint(f"Successfully generated {successful_books} of {len(book_numbers)} requested Gate Pass Books.")

#     def parse_range_input(self, range_string):
#         """
#         Parse range input string like:
#         "1-10" -> [1,2,3,4,5,6,7,8,9,10]
#         "1,10" -> [1,10] 
#         "1-10,15" -> [1,2,3,4,5,6,7,8,9,10,15]
#         "1-3,7-9,12" -> [1,2,3,7,8,9,12]
#         """
#         if not range_string:
#             return []
        
#         # Remove spaces and split by comma
#         range_parts = [part.strip() for part in range_string.split(',')]
#         result = []
        
#         for part in range_parts:
#             if '-' in part:
#                 # Handle range like "1-10"
#                 try:
#                     start, end = map(int, part.split('-'))
#                     if start <= end:
#                         result.extend(range(start, end + 1))
#                     else:
#                         # If start > end, just add the start number
#                         result.append(start)
#                 except ValueError:
#                     frappe.throw(f"Invalid range format: {part}. Use format like 'start-end'.")
#             else:
#                 # Handle single number like "15"
#                 try:
#                     number = int(part)
#                     result.append(number)
#                 except ValueError:
#                     frappe.throw(f"Invalid number: {part}. Use integers only.")
        
#         # Remove duplicates while preserving order
#         unique_result = []
#         for item in result:
#             if item not in unique_result:
#                 unique_result.append(item)
        
#         # Sort the result
#         unique_result.sort()
        
#         return unique_result

##########################################################################
# Final working version with physical gate pass book referance and last generated book field added down
##########################################################################
#19Nov_3;42pm
# import frappe
# from frappe.model.document import Document

# class GenerateGatePassBooks(Document):
#     """
#     Controller for the 'Generate Gate Pass Books' DocType.
#     This script runs on 'validate' when the document is new.
#     """

#     def validate(self):
#         if self.is_new() and self.status == "Draft":
#             self.generate_books_and_passes()
#             self.status = "Completed"

#     def generate_books_and_passes(self):
#         # Parse the range input (now a Data field)
#         range_input = self.range_of_gate_pass_books
#         num_passes_per_book = self.quantity_of_gate_passes
#         series_prefix = self.physical_book_series  # This is now optional

#         if not range_input or not num_passes_per_book:
#             frappe.throw("Please specify 'Range of Gate Pass Books' and 'Quantity of Passes'.")

#         # Parse the range string to get book numbers
#         book_numbers = self.parse_range_input(str(range_input))
        
#         if not book_numbers:
#             frappe.throw("Invalid range format. Please use format like: 1-10, 1-10,15, etc.")

#         # Get the next available system ID by finding max gate_pass_bookno
#         last_book = frappe.db.sql("""
#             SELECT MAX(CAST(SUBSTRING(gate_pass_bookno, 5) AS UNSIGNED)) as max_num 
#             FROM `tabGate Pass Book` 
#             WHERE gate_pass_bookno LIKE 'GPB-%'
#         """, as_dict=True)

#         next_system_id_num = 1
#         if last_book and last_book[0].max_num:
#             next_system_id_num = last_book[0].max_num + 1

#         # Add a counter for accurate reporting
#         successful_books = 0
#         last_generated_book_display_no = None  # Track the last generated book
        
#         for book_number in book_numbers:
#             # Generate physical book ID based on whether series prefix exists
#             if series_prefix:
#                 physical_book_id = f"{series_prefix}{str(book_number).zfill(3)}"
#             else:
#                 physical_book_id = str(book_number).zfill(3)  # Just the number with padding if no prefix

#             # Generate internal system ID (GPB-XXXX format) - guaranteed unique
#             internal_system_book_id = f"GPB-{str(next_system_id_num).zfill(4)}"
#             next_system_id_num += 1  # Increment for next book

#             try:
#                 # Check if book already exists with this display number
#                 existing_book = frappe.db.exists("Gate Pass Book", {
#                     "gate_pass_book_display_no": physical_book_id
#                 })
                
#                 if existing_book:
#                     frappe.msgprint(f"A book with Physical ID {physical_book_id} already exists. Skipping.")
#                     continue

#                 # 3. Create the parent book (Gate Pass Book)
#                 new_book = frappe.new_doc("Gate Pass Book")
                
#                 new_book.gate_pass_book_display_no = physical_book_id
#                 new_book.gate_pass_bookno = internal_system_book_id  # Set the system ID field
#                 new_book.total_pages = num_passes_per_book
#                 new_book.remaining_passes = num_passes_per_book 
#                 new_book.status = "Available"
#                 # Auto-assign to the user who is creating this
#                 new_book.assigned_to = frappe.session.user
                
#                 # Insert the book
#                 new_book.insert(ignore_permissions=True) 

#                 # 4. Create all the child passes (Gate Pass pages)
#                 for page_index in range(num_passes_per_book):
#                     page_number = page_index + 1

#                     # Generate page display ID based on whether series prefix exists
#                     if series_prefix:
#                         physical_page_id = f"{series_prefix}{str(book_number).zfill(3)}-{str(page_number).zfill(2)}"
#                     else:
#                         physical_page_id = f"{str(book_number).zfill(3)}-{str(page_number).zfill(2)}"

#                     # Use internal book ID for the page
#                     internal_system_page_id = f"{internal_system_book_id}-{page_number}"

#                     new_pass = frappe.new_doc("Gate Pass")
                    
#                     new_pass.gate_pass_display_no = physical_page_id
#                     new_pass.gate_pass_no = internal_system_page_id
#                     new_pass.gate_pass_book_no = new_book.name 
#                     new_pass.status = "Available"
                    
#                     new_pass.insert(ignore_permissions=True)

#                 # If we get here, the book AND its pages were created
#                 successful_books += 1
#                 last_generated_book_display_no = physical_book_id  # Update the last generated book

#             except frappe.exceptions.DuplicateEntryError:
#                 frappe.msgprint(f"A book with Physical ID {physical_book_id} already exists. Skipping.")
#             except Exception as e:
#                 frappe.log_error(frappe.get_traceback(), f"Gate Pass Generation Failed for book {book_number}")
#                 frappe.throw(f"Error generating book {book_number}: {str(e)}")

#         # Set the last generated book field after all books are created
#         if last_generated_book_display_no:
#             self.last_generated_book = last_generated_book_display_no

#         # Use the new counter for an accurate message
#         frappe.msgprint(f"Successfully generated {successful_books} of {len(book_numbers)} requested Gate Pass Books.")

#     def parse_range_input(self, range_string):
#         """
#         Parse range input string like:
#         "1-10" -> [1,2,3,4,5,6,7,8,9,10]
#         "1,10" -> [1,10] 
#         "1-10,15" -> [1,2,3,4,5,6,7,8,9,10,15]
#         "1-3,7-9,12" -> [1,2,3,7,8,9,12]
#         """
#         if not range_string:
#             return []
        
#         # Remove spaces and split by comma
#         range_parts = [part.strip() for part in range_string.split(',')]
#         result = []
        
#         for part in range_parts:
#             if '-' in part:
#                 # Handle range like "1-10"
#                 try:
#                     start, end = map(int, part.split('-'))
#                     if start <= end:
#                         result.extend(range(start, end + 1))
#                     else:
#                         # If start > end, just add the start number
#                         result.append(start)
#                 except ValueError:
#                     frappe.throw(f"Invalid range format: {part}. Use format like 'start-end'.")
#             else:
#                 # Handle single number like "15"
#                 try:
#                     number = int(part)
#                     result.append(number)
#                 except ValueError:
#                     frappe.throw(f"Invalid number: {part}. Use integers only.")
        
#         # Remove duplicates while preserving order
#         unique_result = []
#         for item in result:
#             if item not in unique_result:
#                 unique_result.append(item)
        
#         # Sort the result
#         unique_result.sort()
        
#         return unique_result

###########################################################################
import frappe
from frappe.model.document import Document

class GenerateGatePassBooks(Document):
    """
    Controller for the 'Generate Gate Pass Books' DocType.
    This script runs on 'validate' when the document is new.
    """

    def validate(self):
        if self.is_new() and self.status == "Draft":
            self.generate_books_and_passes()
            self.status = "Completed"

    def generate_books_and_passes(self):
        # Parse the range input (now a Data field)
        range_input = self.range_of_gate_pass_books
        num_passes_per_book = self.quantity_of_gate_passes
        series_prefix = self.physical_book_series  # This is now optional

        if not range_input or not num_passes_per_book:
            frappe.throw("Please specify 'Range of Gate Pass Books' and 'Quantity of Passes'.")

        # Parse the range string to get book numbers
        book_numbers = self.parse_range_input(str(range_input))
        
        if not book_numbers:
            frappe.throw("Invalid range format. Please use format like: 1-10, 1-10,15, etc.")

        # Get the next available system ID by finding max gate_pass_bookno
        last_book = frappe.db.sql("""
            SELECT MAX(CAST(SUBSTRING(gate_pass_bookno, 5) AS UNSIGNED)) as max_num 
            FROM `tabGate Pass Book` 
            WHERE gate_pass_bookno LIKE 'GPB-%'
        """, as_dict=True)

        next_system_id_num = 1
        if last_book and last_book[0].max_num:
            next_system_id_num = last_book[0].max_num + 1

        # Add a counter for accurate reporting
        successful_books = 0
        last_generated_book_display_no = None  # Track the last generated book
        
        for book_number in book_numbers:
            # Generate physical book ID based on whether series prefix exists
            if series_prefix:
                physical_book_id = f"{series_prefix}{str(book_number).zfill(3)}"
            else:
                physical_book_id = str(book_number).zfill(3)  # Just the number with padding if no prefix

            # Generate internal system ID (GPB-XXXX format) - guaranteed unique
            internal_system_book_id = f"GPB-{str(next_system_id_num).zfill(4)}"
            next_system_id_num += 1  # Increment for next book

            try:
                # Check if book already exists with this display number
                existing_book = frappe.db.exists("Gate Pass Book", {
                    "gate_pass_book_display_no": physical_book_id
                })
                
                if existing_book:
                    frappe.msgprint(f"A book with Physical ID {physical_book_id} already exists. Skipping.")
                    continue

                # 3. Create the parent book (Gate Pass Book)
                new_book = frappe.new_doc("Gate Pass Book")
                
                new_book.gate_pass_book_display_no = physical_book_id
                new_book.gate_pass_bookno = internal_system_book_id  # Set the system ID field
                new_book.total_pages = num_passes_per_book
                new_book.remaining_passes = num_passes_per_book 
                new_book.status = "Available"
                # Auto-assign to the user who is creating this
                new_book.assigned_to = frappe.session.user
                
                # Insert the book
                new_book.insert(ignore_permissions=True) 

                # 4. Create all the child passes (Gate Pass pages)
                for page_index in range(num_passes_per_book):
                    page_number = page_index + 1

                    # Generate page display ID based on whether series prefix exists
                    if series_prefix:
                        physical_page_id = f"{series_prefix}{str(book_number).zfill(3)}-{str(page_number).zfill(2)}"
                    else:
                        physical_page_id = f"{str(book_number).zfill(3)}-{str(page_number).zfill(2)}"

                    # Use internal book ID for the page
                    internal_system_page_id = f"{internal_system_book_id}-{page_number}"

                    new_pass = frappe.new_doc("Gate Pass")
                    
                    new_pass.gate_pass_display_no = physical_page_id
                    new_pass.gate_pass_no = internal_system_page_id
                    new_pass.gate_pass_book_no = new_book.name 
                    new_pass.status = "Available"
                    
                    new_pass.insert(ignore_permissions=True)

                # If we get here, the book AND its pages were created
                successful_books += 1
                last_generated_book_display_no = physical_book_id  # Update the last generated book

            except frappe.exceptions.DuplicateEntryError:
                frappe.msgprint(f"A book with Physical ID {physical_book_id} already exists. Skipping.")
            except Exception as e:
                frappe.log_error(frappe.get_traceback(), f"Gate Pass Generation Failed for book {book_number}")
                frappe.throw(f"Error generating book {book_number}: {str(e)}")

        # Set the last generated book field after all books are created
        if last_generated_book_display_no:
            self.last_generated_book = last_generated_book_display_no

        # Create a formatted range string for the success message
        if book_numbers:
            # Convert book_numbers to a readable range format
            formatted_range = self.format_range_string(book_numbers)
            if series_prefix:
                frappe.msgprint(f"Gate Pass Books with range of {formatted_range} (Series: {series_prefix}) have been generated successfully!")
            else:
                frappe.msgprint(f"Gate Pass Books with range of {formatted_range} have been generated successfully!")
        else:
            frappe.msgprint(f"Successfully generated {successful_books} of {len(book_numbers)} requested Gate Pass Books.")

    def parse_range_input(self, range_string):
        """
        Parse range input string like:
        "1-10" -> [1,2,3,4,5,6,7,8,9,10]
        "1,10" -> [1,10] 
        "1-10,15" -> [1,2,3,4,5,6,7,8,9,10,15]
        "1-3,7-9,12" -> [1,2,3,7,8,9,12]
        """
        if not range_string:
            return []
        
        # Remove spaces and split by comma
        range_parts = [part.strip() for part in range_string.split(',')]
        result = []
        
        for part in range_parts:
            if '-' in part:
                # Handle range like "1-10"
                try:
                    start, end = map(int, part.split('-'))
                    if start <= end:
                        result.extend(range(start, end + 1))
                    else:
                        # If start > end, just add the start number
                        result.append(start)
                except ValueError:
                    frappe.throw(f"Invalid range format: {part}. Use format like 'start-end'.")
            else:
                # Handle single number like "15"
                try:
                    number = int(part)
                    result.append(number)
                except ValueError:
                    frappe.throw(f"Invalid number: {part}. Use integers only.")
        
        # Remove duplicates while preserving order
        unique_result = []
        for item in result:
            if item not in unique_result:
                unique_result.append(item)
        
        # Sort the result
        unique_result.sort()
        
        return unique_result

    def format_range_string(self, numbers):
        """
        Format a list of numbers into a readable range string.
        Example: [1,2,3,4,5,10,11,12] -> "1-5, 10-12"
        """
        if not numbers:
            return ""
        
        if len(numbers) == 1:
            return str(numbers[0])
        
        # Group consecutive numbers
        ranges = []
        start = numbers[0]
        end = numbers[0]
        
        for i in range(1, len(numbers)):
            if numbers[i] == end + 1:
                # Consecutive number, extend the range
                end = numbers[i]
            else:
                # Gap found, save current range and start new one
                if start == end:
                    ranges.append(str(start))
                else:
                    ranges.append(f"{start}-{end}")
                start = end = numbers[i]
        
        # Add the last range
        if start == end:
            ranges.append(str(start))
        else:
            ranges.append(f"{start}-{end}")
        
        return ", ".join(ranges)