import PyPDF2
import json
import re

def extract_floor_plan_data(pdf_path):
    """Extract room information from KIIT Campus 25 floor plan PDF"""
    
    with open(pdf_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        
        # Extract text from all pages
        all_text = ""
        for page in pdf_reader.pages:
            all_text += page.extract_text() + "\n"
        
        print("=== EXTRACTED TEXT FROM PDF ===")
        print(all_text)
        print("\n=== END OF EXTRACTED TEXT ===\n")
        
        # Try to find room patterns
        room_patterns = [
            r'[A-C]\s*\d{3}',  # A 001, B 002, C 003 format
            r'Room\s+[A-C]\d{3}',
            r'Lab\s+[A-C]\d{3}',
        ]
        
        rooms_found = []
        for pattern in room_patterns:
            matches = re.findall(pattern, all_text, re.IGNORECASE)
            rooms_found.extend(matches)
        
        print(f"Rooms found: {set(rooms_found)}")
        
        return all_text

if __name__ == "__main__":
    pdf_path = "Ground Floor KIIT Campus 25 .pdf"
    extract_floor_plan_data(pdf_path)
