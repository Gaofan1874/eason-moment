const fs = require('fs');
const path = require('path');
const OpenCC = require('opencc-js');

// 初始化转换器：简体 -> 繁体 (香港)
// 为什么选香港繁体？因为陈奕迅是香港歌手，歌词通常使用港式繁体（如 “裡” 而不是 “里”）
const converter = OpenCC.Converter({ from: 'cn', to: 'hk' });

const LYRICS_PATH = path.join(__dirname, '../src/assets/lyrics.json');

async function main() {
  console.log('📝 Reading lyrics.json...');
  
  let rawData;
  try {
    rawData = fs.readFileSync(LYRICS_PATH, 'utf-8');
  } catch (e) {
    console.error('❌ Could not read lyrics file:', e.message);
    process.exit(1);
  }

  let lyrics;
  try {
    lyrics = JSON.parse(rawData);
  } catch (e) {
    console.error('❌ Invalid JSON in lyrics file:', e.message);
    process.exit(1);
  }

  console.log(`🔍 Analyzing ${lyrics.length} lyric entries...`);

  let updatedCount = 0;

  const updatedLyrics = lyrics.map((item, index) => {
    let hasChange = false;
    const newItem = { ...item };

    // 1. Content (歌词内容)
    // 如果没有繁体字段，或者繁体字段和简体完全一样（说明可能是新加的，或者原文就是简体且未处理）
    // 注意：有些句子简繁体本身就一样（如“我爱你”），所以这里我们总是重新生成以确保准确，
    // 除非你希望保留手动修改的繁体。
    // 策略：如果字段不存在，或者等于简体，就转换。
    
    if (!newItem.contentTraditional || newItem.contentTraditional === newItem.content) {
      const converted = converter(newItem.content);
      if (converted !== newItem.contentTraditional) {
        newItem.contentTraditional = converted;
        hasChange = true;
      }
    }

    // 2. Song Name (歌名)
    if (!newItem.songTraditional || newItem.songTraditional === newItem.song) {
      const converted = converter(newItem.song);
      if (converted !== newItem.songTraditional) {
        newItem.songTraditional = converted;
        hasChange = true;
      }
    }

    // 3. Album Name (专辑名)
    if (!newItem.albumTraditional || newItem.albumTraditional === newItem.album) {
      const converted = converter(newItem.album);
      if (converted !== newItem.albumTraditional) {
        newItem.albumTraditional = converted;
        hasChange = true;
      }
    }

    if (hasChange) {
      updatedCount++;
      // Optional: Log changes for the first few items to verify
      // console.log(`   [Update ID ${item.id}] ${item.content} -> ${newItem.contentTraditional}`);
    }

    return newItem;
  });

  if (updatedCount > 0) {
    console.log(`✨ Updating ${updatedCount} entries...`);
    fs.writeFileSync(LYRICS_PATH, JSON.stringify(updatedLyrics, null, 2), 'utf-8');
    console.log('✅ Done! lyrics.json has been updated.');
  } else {
    console.log('👌 No updates needed. All lyrics contain traditional fields.');
  }
}

main();
