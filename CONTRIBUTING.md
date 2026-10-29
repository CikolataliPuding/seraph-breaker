# Katkı rehberi

Oyunu istediğin gibi değiştirebilirsin: yeni boss, yeni silah, yeni oda düzeni, denge ayarı,
müzik, menü, ne istersen. Tek kural şu: `main` dalına doğrudan yazılamaz. Her değişiklik bir
Pull Request (PR) olarak gelir ve proje sahibi (@selameddin00) onayladıktan sonra oyuna girer.
Onaylanan değişiklikler birkaç dakika içinde https://selameddin00.github.io/seraph-breaker/
adresinde yayına çıkar.

## Katkı şartları

Autocrat açık kaynak değildir; kaynağı görünür bir lisansla ([LICENSE](LICENSE)) yayınlanır ve proje sahibinin ticari oyunudur. Katkılar memnuniyetle karşılanır, ama şu şartlarla:

- Pull request (ya da issue'ya eklediğin kod veya varlık) göndererek, onu göndermeye **hakkın olduğunu** onaylarsın: kendi yazdığın ya da kullanma hakkın olan kod, görsel ve ses. Telifli içerik ekleme.
- Katkının oyunda ve oyundan ayrı olarak kullanılması, değiştirilmesi, yayınlanması ve ticari olarak satılması için proje sahibine **süresiz, dünya çapında, geri alınamaz, ücretsiz ve devredilebilir** bir kullanım hakkı vermiş olursun (LICENSE, madde 4).
- Fork'unu sadece bu depoya PR hazırlamak için kullanabilirsin; fork'u başka yerde yayınlamak ya da oynatmak lisansa aykırıdır.
- PR şablonundaki "katkı şartlarını kabul ediyorum" kutusunu işaretle.

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
| `js/core.js` | Her yerde kullanılan küçük yardımcılar (`$`, `rand`, `clamp`, `isTouch`, `mobileMode` ...) |
| `js/lang-tr.js` | Türkçe metinler: İngilizce metin → Türkçe karşılığı (`DICT_TR`). Sadece veri. |
| `js/i18n.js` | Dil desteği. `t('English text', ...)` aktif dildeki metni verir, karşılık yoksa İngilizce kalır. Veri tablolarını (`langData`, `data.js`'in sonunda) ve statik HTML'i (`langDom`) yükleme anında çevirir. Dil `seraph-breaker-lang` anahtarında; System'den değişince sayfa yenilenir. Eksik çeviriler: konsolda `[...LANG_MISS]`. |
| `js/data.js` | **Oyun verisi.** Birimler (`UNITS`), silahlar (`WEAPONS`), aletler (`GADGETS`), yetenek ağacı (`TREE`), Core statlar (`CORE`), arenalar (`ARENAS`, `MODS`), düşmanlar (`ENEMY`), koşu yetenekleri (`RSK`, `RARITY`), şeytan lanetleri (`CURSES`), eşyalar (`ITEMS`), bosslar (`BOSSES` + corrupted varyantlar), oda düzenleri (`ROOMS`), ikonlar (`IC`). Katkıların çoğu buradan başlar. |
| `js/balance.js` | Denge sistemi: stat kovaları (aynı stattaki bonuslar toplanır, kovalar çarpılır), soft/hard cap'ler, proc limitleri, düşman ölçek eğrisi (`enemyScale`), oyuncu güç tahmini (`powerEstimate`), ekonomi yardımcıları. Sayılar `data.js` içindeki `BAL`, `SCALE`, `XP_NEED`, `ECON`'da. |
| `js/save.js` | Kayıt (localStorage). Yeni alanlar `DEF_P`'ye varsayılanla eklenir, eski kayıtlar `normP` ile açılır. |
| `js/audio.js` | Tarayıcıda üretilen müzik (`TRACKS`), Main Stage moblarının kilitlendiği vuruş saati (`BEAT`) ve ses efektleri (`sfx`), High-Co'nun form parçaları için yuvalar (`hcMusic`, dosyalar `assets/audio/`) |
| `js/renderer.js` | Three.js sahnesi, kamera (bilgisayar: izometrik, telefon: dik ve odaya sığan), ışıklar, şehir; oda boyutları (`ROOM_X`, `ROOM_Z`, `BOSS_X`, `BOSS_Z`, telefonda `ROOM_X_M`, `BOSS_X_M`) |
| `js/models.js` | Mecha, melek, arena mobları ve boss 3D modelleri (`buildMech`, `BOSS_BUILD`, `corruptModel`). Yeni modellerin kaynağı `docs/bestiary.html`, Main Stage kadrosununki `docs/main-stage.html`, yeni moblar, tier varyantları ve ayna kopyalarınınki `docs/mob-designs.html`. |
| `js/preview.js` | Hangardaki dönen mecha ve boss portreleri |
| `js/input.js` | Klavye ve fare |
| `js/mobile.js` | Kontrol modu, telefon joystick'i, otomatik nişan, otomatik kalkan |
| `js/state.js` | Ortak oyun durumu |
| `js/fx.js` | Görsel efektler |
| `js/juice.js` | Oyun hissi: hitstop, yavaş çekim, yaylar (`spring`), vuruş tepkisi, ölüm parçaları |
| `js/tester.js` | Tester kodu (sadece SHA-256 özeti), Main Stage erişim kodu (`stageOK`, `arenaOpen`), beta rozeti, farm kontrolü (`farmMul`) |
| `js/rooms.js` | Oda kurulumu, engeller, kapı, zemin tehlikeleri, rol tabanlı kompozisyon ve oda tipleri (`buildRoom`, `composeRoom`, `startCombat`, `startRoom`), Main Stage dalga odaları (`composeStage`, `stageWaves`; sayılar `data.js` içindeki `STAGE`'de) |
| `js/nav.js` | Düşman navigasyonu: oda ızgarası, flow field, görüş haritası, A* yollar, açı slotları, saldırı jetonları |
| `js/traps.js` | Tuzaklar (`~`): testere rayı, diken karoları, ışık sütunları |
| `js/bullets.js` | Mermiler |
| `js/enemies.js` | Düşman oluşturma, hasar ve ölüm (`spawnEnemy`, `hitEnemy`, `killEnemy`) |
| `js/skills.js` | Tecrübe, yetenek ruleti, melek/şeytan teklifleri, orbitler ve yetenek etkileri |
| `js/items.js` | Eşya düşürme, 4 slot ve takas |
| `js/player.js` | Oyuncu, özel hareketler, aletler ve silahlar (`weaponUpdate`) |
| `js/enemy-ai.js` | Düşman davranışları rollerle (`AI`, `ATK` ve `ANIM` tabloları), hareket (`steer`), elit nitelikleri |
| `js/bosses.js` | Boss saldırıları (`bossTick`), boss parçaları, High-Co, Hexarch (petek zemin, yörünge hücreleri, mühür) ve sinematik giriş |
| `js/run.js` | Arena koşusu: tohumlu koşu planı (`arenaPlan`, `PACING`), boss seçimi, koşu kaydı ve devam |
| `js/flow.js` | Oda geçişleri, sonuç ekranı, duraklatma |
| `js/ui-hangar.js` | Hangar menüsü ve alt menü |
| `js/ui-warmap.js` | Arena seçimi, cephanelik, Core + yetenek ağacı, birim ve ayar panelleri |
| `js/debug.js` | Tester kodu ile açılan test paneli, koşu kaydı, simülasyon, otomatik pilot ve ölçüm (`DBG.measure`) |
| `js/main.js` | Oyun döngüsü (`frame`) ve başlatma. Her zaman en son yüklenir. |

Yeni bir dosya eklersen `index.html`'de doğru sıraya bir `<script src="js/...?v=N">` satırı ekle (aynı `?v=` numarasıyla).
Bir dosyanın en üst seviyesinde, sonraki bir dosyada tanımlanan bir şeyi hemen çağırma; öyle bir kod gerekiyorsa `js/main.js` içindeki başlatma bölümüne koy.

### Sürüm numarası (cache busting)

`index.html` içindeki her `css/` ve `js/` bağlantısının sonunda `?v=N` var (örneğin `js/main.js?v=9`). Tarayıcılar ve GitHub Pages
dosyaları önbellekte tutar; numara değişmezse oyuncular eski kodu görmeye devam eder (eski "12 rooms" HUD'u böyle kaldı).
**Her sürümde (main'e giden her PR'da) bu numarayı bir artır**, bütün satırlarda aynı olsun. Tek komutla:

```bash
sed -i -E 's/\?v=[0-9]+/?v=10/g' index.html
```

Oyun içinde System menüsünde "Build N" yazar; oyuncu eski sürümdeyse buradan anlaşılır.

Kolay başlangıç fikirleri:

- **Yeni oda düzeni:** `js/data.js` içindeki `ROOMS` listesine 15 satır × 11 karakterlik yeni bir harita ekle. `#` blok, `~` tuzak (üstünden yürünür; arka arkaya `~` hücreleri tek bir tuzaktır: arenaya göre testere rayı, diken karoları ya da ışık sütunları, ayarları `TRAPS`'ta), `.` boş alan. İlk satır kapı tarafı, son satır giriş tarafı; ilk satırın ve son iki satırın ortası boş kalsın.
- **Denge ayarı:** Silah hasarları `js/player.js` içindeki `weaponUpdate`, düşman canları `js/data.js` içindeki `ENEMY`, boss canları `BOSSES`, arena zorluğu `ARENAS` (`hpMul`, `dmgMul`, `bossMul`), odadan odaya büyüme `SCALE`, cap'ler `BAL`, ekonomi `ECON`. Bir değişikliğin etkisini görmek için `?debug=1` ile açıp konsolda `DBG.sim()` çalıştır.
- **Yeni koşu yeteneği:** `js/data.js` içindeki `RSK` listesine `{name, d, rarity, max, icon, bonus}` ile ekle (`apply` sadece yan etkiler için; `bonus` cap'lere ve kart önizlemesine kendiliğinden girer), ikonunu `IC`'ye koy. Stat yetenekleri sadece `bonus` ister; özel etkiler `player.rs.<id>` okunarak `js/enemies.js` (`hitEnemy`, `killEnemy`) ya da `js/bullets.js` içine yazılır.
- **Yeni eşya:** `ITEMS` listesine `{name, d, rarity, icon, shape, color, bonus}` ekle. Stat dışı bayraklar için `add` ve `rem` kullan; birbirinin tersi olmalı ki eşya takas edilebilsin.
- **Yeni düşman:** `ENEMY` listesine ekle (`role`, `tag`, `mass`, gerekiyorsa `band`), `js/enemy-ai.js` içindeki `AI` ve `ANIM` tablolarına birer fonksiyon yaz (hazır yardımcılar: `holdBand`, `chase`, `seek`, `attackCycle`), bir arenanın `mobs` listesine ve istersen `COMPS` şablonlarına koy.
- **Yeni oda tipi ya da tempo:** `ROOM_KINDS` ve `PACING` (`js/data.js`); başlangıcı `startCombat` (`js/rooms.js`), oda içindeki akışı `roomKinds` (`js/main.js`).
- **Oyuna metin eklemek:** Kod içinde yazılan metin `t('English text')` ile yazılır. Sayılar metnin içine değil yer tutucuya girer: `t('Best room {0}/{1}', best, rooms)`. Türkçesini `js/lang-tr.js`'e ekle. `data.js` tablolarındaki `name`, `d`, `tag` gibi alanlar ve `index.html`'deki statik metinler kendiliğinden çevrilir; sadece sözlüğe satır eklemek yeter.
- **Yeni dil:** `js/lang-tr.js` gibi bir `js/lang-xx.js` aç, `index.html`'de `i18n.js`'ten önce yükle, `js/i18n.js` içindeki `LANGS` ve `DICT`'e birer satır ekle. Fontların o alfabeyi desteklediğini kontrol et.

## İyi bir PR için

- Bir PR'da tek bir konu olsun. Küçük PR'lar daha hızlı incelenir.
- Göndermeden önce oyunu bir kez baştan açıp tarayıcı konsolunda hata olmadığına bak.
- Başka birinin özelliğini kaldırıyorsan ya da büyük ölçüde değiştiriyorsan, PR açıklamasında nedenini yaz.
- Kod, görsel ya da ses eklerken kullanma hakkın olduğundan emin ol. Telifli içerik ekleme.

## Fikir ya da hata bildirmek

Kod yazmadan da katkı verebilirsin: **Issues** sekmesinden bir fikir öner ya da bulduğun hatayı yaz.
