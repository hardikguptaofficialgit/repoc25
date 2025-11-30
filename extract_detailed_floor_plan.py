import pdfplumber
import json
import re

def extract_floor_plan_detailed(pdf_path):
    """Extract detailed room information from KIIT Campus 25 floor plan PDF"""
    
    rooms_data = []
    
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages):
            # Extract text
            text = page.extract_text()
            print(f"\n=== PAGE {page_num + 1} TEXT ===")
            print(text)
            
            # Extract tables if any
            tables = page.extract_tables()
            if tables:
                print(f"\n=== PAGE {page_num + 1} TABLES ===")
                for table in tables:
                    print(table)
            
            # Extract words with positions
            words = page.extract_words()
            print(f"\n=== PAGE {page_num + 1} WORDS WITH POSITIONS ===")
            for word in words[:50]:  # First 50 words
                print(f"{word['text']}: x={word['x0']:.2f}, y={word['top']:.2f}")
            
            # Look for room patterns
            room_pattern = r'[A-C]\s*\d{3}'
            if text:
                matches = re.findall(room_pattern, text)
                if matches:
                    print(f"\nRooms found on page {page_num + 1}: {matches}")
                    rooms_data.extend(matches)
    
    print(f"\n\n=== SUMMARY ===")
    print(f"Total rooms found: {len(set(rooms_data))}")
    print(f"Unique rooms: {sorted(set(rooms_data))}")
    
    return rooms_data

if __name__ == "__main__":
    pdf_path = "Ground Floor KIIT Campus 25 .pdf"
    extract_floor_plan_detailed(pdf_path)
