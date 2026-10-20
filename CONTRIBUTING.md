# Katkı rehberi

Oyunu istediğin gibi değiştirebilirsin: yeni boss, yeni silah, yeni oda düzeni, denge ayarı,
müzik, menü, ne istersen. Tek kural şu: `main` dalına doğrudan yazılamaz. Her değişiklik bir
Pull Request (PR) olarak gelir ve proje sahibi (@selameddin00) onayladıktan sonra oyuna girer.
Onaylanan değişiklikler birkaç dakika içinde https://selameddin00.github.io/seraph-breaker/
adresinde yayına çıkar.

## Adım adım

1. Sağ üstteki **Fork** butonuyla repoyu kendi hesabına kopyala.
2. Kendi kopyanda yeni bir dal aç, örneğin `yeni-boss-kraken`.
3. Değişikliğini yap ve `index.html` dosyasını tarayıcıda açıp dene (README'deki çalıştırma notuna bak).
4. Commit at, kendi fork'una gönder (push).
5. GitHub'da bu repoya **Pull Request** aç. Ne değiştirdiğini ve nasıl denediğini kısaca yaz.
6. Proje sahibi inceler. Gerekirse yorum bırakır, uygun bulursa birleştirir.

Git kullanmayı bilmiyorsan sorun değil: GitHub'ın web arayüzünde `index.html` dosyasını açıp
kalem ikonuyla düzenleyebilirsin. GitHub senin için otomatik olarak fork ve PR oluşturur.

## Kodun haritası

Oyunun tamamı `index.html` içinde. Script bölümü başlıklarla ayrılmış (`/* ===== ... ===== */`):

| Bölüm | Ne var |
|---|---|
| `DATA` | Birimler (`UNITS`), silahlar (`WEAPONS`), aletler (`GADGETS`), yetenek ağacı (`TREE`), level içi yetenekler (`RSK`), stage'ler (`STAGES`), bosslar (`BOSSES`), oda düzenleri (`ROOMS`) |
| `AUDIO` | Tarayıcıda üretilen müzik (`TRACKS`) ve ses efektleri (`sfx`) |
| `MODELS` | Mecha, melek ve boss 3D modelleri |
| `ROOMS` | Oda kurulumu, minder sınırı, engeller, kapı |
| `ENEMIES` / `ENEMY AI` | Düşman çeşitleri ve davranışları |
| `BOSSES` | Boss saldırıları (`bossTick`) |
| `LEVEL FLOW` | Level başlatma, oda geçişleri, sonuç ekranı |
| `HANGAR UI` / `WAR MAP` | Menü ve level haritası |

Kolay başlangıç fikirleri:

- **Yeni oda düzeni:** `ROOMS` listesine 9 satır × 9 karakterlik yeni bir harita ekle. `#` blok, `~` kanal, `.` boş alan. İlk satır kapı tarafı, son satır giriş tarafı.
- **Denge ayarı:** Silah hasarları `weaponUpdate`, düşman canları `spawnEnemy`, boss canları `BOSSES` içinde.
- **Yeni level içi yetenek:** `RSK` listesine ekle, etkisini `applySkill` ya da `hitEnemy` içine yaz.

## İyi bir PR için

- Bir PR'da tek bir konu olsun. Küçük PR'lar daha hızlı incelenir.
- Göndermeden önce oyunu bir kez baştan açıp tarayıcı konsolunda hata olmadığına bak.
- Başka birinin özelliğini kaldırıyorsan ya da büyük ölçüde değiştiriyorsan, PR açıklamasında nedenini yaz.
- Kod, görsel ya da ses eklerken kullanma hakkın olduğundan emin ol. Telifli içerik ekleme.

## Fikir ya da hata bildirmek

Kod yazmadan da katkı verebilirsin: **Issues** sekmesinden bir fikir öner ya da bulduğun hatayı yaz.
