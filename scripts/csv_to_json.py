import csv
import json
import os
import re

csv_file = 'eason_songs_list.csv'
json_file = 'src/assets/lyrics.json'

def main():
    print(f"📖 Reading from {csv_file}...")
    
    new_lyrics_list = []
    current_id = 1
    
    try:
        with open(csv_file, 'r', encoding='utf-8-sig') as f:
            reader = csv.reader(f)
            headers = next(reader)
            
            for row in reader:
                if not row: continue
                
                song = row[0].strip()
                album = row[1].strip()
                tags_str = row[3].strip()
                content_str = row[4].strip()
                
                if not song or not content_str:
                    continue
                
                # Parse Tags
                tags = [t.strip() for t in tags_str.split(',')] if tags_str else []
                tags = [t for t in tags if t]
                
                # Parse Content (Support both | and ｜ using Regex)
                # Split by | or ｜, and handle surrounding spaces
                lyrics = re.split(r'\s*[|｜]\s*', content_str)
                
                for lyric_line in lyrics:
                    lyric_line = lyric_line.strip()
                    if not lyric_line: continue
                    
                    new_item = {
                        "id": current_id,
                        "content": lyric_line,
                        "song": song,
                        "album": album,
                        "tags": tags,
                        "link": f"https://music.163.com/#/search/m/?s={song}" 
                    }
                    
                    new_lyrics_list.append(new_item)
                    current_id += 1

        print(f"✨ Parsed {len(new_lyrics_list)} lyrics entries.")
        
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(new_lyrics_list, f, ensure_ascii=False, indent=2)
            
        print(f"✅ Successfully wrote to {json_file}")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()