# Katkı rehberi

Oyunu istediğin gibi değiştirebilirsin: yeni boss, yeni silah, yeni oda düzeni, denge ayarı,
müzik, menü, ne istersen. Tek kural şu: `main` dalına doğrudan yazılamaz. Her değişiklik bir
Pull Request (PR) olarak gelir ve proje sahibi (@selameddin00) onayladıktan sonra oyuna girer.
Onaylanan değişiklikler birkaç dakika içinde https://selameddin00.github.io/seraph-breaker/
adresinde yayına çıkar.

## Adım adım

1. Sağ üstteki **Fork** butonuyla repoyu kendi hesabına kopyala.
2. Kendi kopyanda yeni bir dal aç, örneğin `yeni-boss-kraken`.
3. Değişikliğini yap ve `index.html` dosyasını tarayıcıda açıp dene (README'deki çalıştırma notuna bak). Kod `js/` klasöründe, haritası aşağıda.
4. Commit at, kendi fork'una gönder (push).
5. GitHub'da bu repoya **Pull Request** aç. Ne değiştirdiğini ve nasıl denediğini kısaca yaz.
6. Proje sahibi inceler. Gerekirse yorum bırakır, uygun bulursa birleştirir.

Git kullanmayı bilmiyorsan sorun değil: GitHub'ın web arayüzünde değiştirmek istediğin dosyayı
(çoğu zaman `js/data.js`) açıp kalem ikonuyla düzenleyebilirsin. GitHub senin için otomatik olarak fork ve PR oluşturur.

## Kodun haritası

`index.html` sadece sayfanın iskeleti. Görünüm `css/style.css` içinde, oyun kodu `js/` klasöründe.
Build adımı yok: dosyalar `index.html`'deki sırayla, sıradan `<script>` etiketleriyle yüklenir.
Bir dosyada en üst seviyede tanımlanan her şey (fonksiyonlar, `const`/`let`) sonraki dosyalardan görülebilir.

| Dosya | Ne var |
|---|---|
| `js/core.js` | Her yerde kullanılan küçük yardımcılar (`$`, `rand`, `clamp`, `isTouch` ...) |
| `js/data.js` | **Oyun verisi.** Birimler (`UNITS`), silahlar (`WEAPONS`), aletler (`GADGETS`), yetenek ağacı (`TREE`), level içi yetenekler (`RSK`, ikonları `RSK_IC`), stage'ler (`STAGES`), bosslar (`BOSSES`), oda düzenleri (`ROOMS`). Katkıların çoğu buradan başlar. |
| `js/save.js` | Kayıt (localStorage) |
| `js/audio.js` | Tarayıcıda üretilen müzik (`TRACKS`) ve ses efektleri (`sfx`) |
| `js/renderer.js` | Three.js sahnesi, kamera, ışıklar, şehir; arena boyutları (`ROOM_R`, `BOSS_R`, `OUTW`, `OUT_DPS`) |
| `js/models.js` | Mecha, melek ve boss 3D modelleri (`buildMech`, `BOSS_BUILD`) |
| `js/preview.js` | Hangardaki dönen mecha ve boss portreleri |
| `js/input.js` | Klavye, fare ve dokunmatik kontroller |
| `js/state.js` | Ortak oyun durumu |
| `js/fx.js` | Görsel efektler |
| `js/rooms.js` | Oda kurulumu, minder sınırı, engeller, kapı, düşman dalgaları (`buildRoom`, `composeRoom`, `startRoom`) |
| `js/bullets.js` | Mermiler |
| `js/enemies.js` | Düşman oluşturma, hasar ve ölüm (`spawnEnemy`, `hitEnemy`) |
| `js/skills.js` | Level içi tecrübe ve yetenek seçimi (`applySkill`) |
| `js/player.js` | Oyuncu, özel hareketler, aletler ve silahlar (`weaponUpdate`) |
| `js/enemy-ai.js` | Düşman davranışları (`updateEnemies`) |
| `js/bosses.js` | Boss saldırıları (`bossTick`) ve sinematik giriş |
| `js/flow.js` | Level başlatma, oda geçişleri, sonuç ekranı |
| `js/ui-hangar.js` | Hangar menüsü ve alt menü |
| `js/ui-warmap.js` | War Map, cephanelik, yetenek ağacı, birim ve ayar panelleri |
| `js/main.js` | Oyun döngüsü (`frame`) ve başlatma. Her zaman en son yüklenir. |

Yeni bir dosya eklersen `index.html`'de doğru sıraya bir `<script src="js/...">` satırı ekle.
Bir dosyanın en üst seviyesinde, sonraki bir dosyada tanımlanan bir şeyi hemen çağırma; öyle bir kod gerekiyorsa `js/main.js` içindeki başlatma bölümüne koy.

Kolay başlangıç fikirleri:

- **Yeni oda düzeni:** `js/data.js` içindeki `ROOMS` listesine 9 satır × 9 karakterlik yeni bir harita ekle. `#` blok, `~` kanal, `.` boş alan. İlk satır kapı tarafı, son satır giriş tarafı.
- **Denge ayarı:** Silah hasarları `js/player.js` içindeki `weaponUpdate`, düşman canları `js/enemies.js` içindeki `spawnEnemy`, boss canları `js/data.js` içindeki `BOSSES` içinde.
- **Yeni level içi yetenek:** `js/data.js` içindeki `RSK` listesine ekle ve ikonunu `RSK_IC`'e bağla. Etkisini `js/skills.js` içindeki `applySkill` ya da `js/enemies.js` içindeki `hitEnemy` içine yaz.

## İyi bir PR için

- Bir PR'da tek bir konu olsun. Küçük PR'lar daha hızlı incelenir.
- Göndermeden önce oyunu bir kez baştan açıp tarayıcı konsolunda hata olmadığına bak.
- Başka birinin özelliğini kaldırıyorsan ya da büyük ölçüde değiştiriyorsan, PR açıklamasında nedenini yaz.
- Kod, görsel ya da ses eklerken kullanma hakkın olduğundan emin ol. Telifli içerik ekleme.

## Fikir ya da hata bildirmek

Kod yazmadan da katkı verebilirsin: **Issues** sekmesinden bir fikir öner ya da bulduğun hatayı yaz.
