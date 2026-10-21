# Seraph Breaker

Anime tarzı bir mecha aksiyon roguelite oyunu. Tarayıcıda çalışır, kurulum gerektirmez.
Mavi, kırmızı ve yeşil mechalarla şehri makinelere ve meleklere karşı savunuyorsun.
Bilgisayarda ve telefonda ayrı, kendine özgü kontrollerle oynanır.

**Hemen oyna:** https://selameddin00.github.io/seraph-breaker/

Bu proje bir topluluk projesi. Oyunun fikri arkadaş grubumuzdan çıktı; herkes istediği
özelliği ekleyebilir, istediği şeyi değiştirebilir. Nasıl katkı vereceğin
[CONTRIBUTING.md](CONTRIBUTING.md) dosyasında.

## Oyunda neler var

- **4 arena, her biri tek koşu:** Outer City (30 oda), Night Harbor (40), Heaven's Gate (50) ve Fallen Sky (50). Odalar kısa, Archero tarzı: çoğu tek dalga.
- **Oda düzeni:** Her 10. oda boss, diğer 5. odalar melek, yaklaşık her 7. oda elit. Bosslar arenanın havuzundan rastgele gelir, aynı boss arka arkaya gelmez.
- **Kalıcı güçlenme:** Yetenekler, pilot seviyesi ve eşyalar bütün koşu boyunca kalır, ölünce ya da arena bitince sıfırlanır. Toplanan altın ve elmas her zaman sende kalır.
- **Koşu kaydı:** Her temizlenen odadan sonra koşu kaydedilir. Uygulamayı kapatsan bile hangardan **Continue run** ile kaldığın odadan devam edersin.
- **Arena kuralları:** Night Harbor'da düşman mermileri %15 hızlı, Heaven's Gate'te elitler ikili gelir, Fallen Sky'da iki taraf birlikte gelir, elitler corrupted olur ve her koşuya 2 rastgele modifier eklenir. 2. arenadan itibaren bazı odalarda ateş menfezleri ve çöken zeminler var.
- **Yetenek ruleti:** Level atlayınca 3 kart slot makinesi gibi döner. Nadirlikler: Common (saf stat), Rare (mermi değiştiriciler, öldürünce tetiklenenler), Epic (orbitler, mekaniğe özel), Legendary (evrimler). Sahip olduğun yetenekler daha sık gelir, yükseltilebilecek bir yeteneğin varsa kartlardan biri mutlaka yükseltmedir. Koşu başına 1 reroll. Dokunmak ya da tuşa basmak dönüşü atlar.
- **Evrimler:** Twin Shot + Rapid Cycle → Bullet Storm, Burn Rounds + Orbit Blades → Inferno Ring, Chain Spark + Bolt Orbit → Storm Halo, Vampiric Core + Rage → Blood Engine. İki yetenek de maksimumdayken teklif edilir.
- **Melek ve şeytan:** Melek tamir ya da yetenek verir. Hasar almadan temizlenen odalardan sonra şeytan gelebilir: Glass Cannon, Berserk, Greed ya da Brittle lanetlerinden biri karşılığında güç verir. İstersen "Walk away" diyebilirsin.
- **Eşyalar:** Elitler %25, bosslar her zaman eşya düşürür. 4 slot var, dolunca hangisini bırakacağını seçersin. Plated Core, Servo Boots, Capacitor, Mine Layer, Thorn Plating, Halo Fragment, Overclock Chip, Lucky Coin ve daha fazlası.
- **Düşmanlar:** Drone, Heavy, Seraph, Warden ve yeni gelenler: Spark, Crawler, Howitzer, Lancer, Bulwark, Shardling, Cherub, Censer, Ophan. Her saldırının okunabilir bir uyarısı var.
- **Bosslar:** Iron Colossus, Prism Angel, The Last Seraph, Hive Carrier, Siege Arachne, Ophanim Throne ve Archon. Her bossun sinematik girişi var. Her birinin bir de **Corrupted** sürümü var: mor renk, kristal dikenler, başka bir bosstan ödünç saldırılar.
- **3 birim:** Azure (hızlı tüfek), Crimson (saçma topu), Verdant (delici mızrak). Her birinin kendi özel hareketi var.
- **Kalıcı ilerleme:** Altınla **Core** statları (Armor, Damage, Power regen; her biri 30 seviye) ve yetenek ağacı, elmasla 6 silah ve 7 alet. Kayıt tarayıcıda tutulur, eski kayıtlar da açılır.
- **His:** Vuruşlarda kısa donma (hitstop), geri tepme, düşmanlar parçalarına ayrılarak ölür, mechalar harekete eğilir.
- **Müzik:** Tarayıcıda canlı üretilen metal müzik. Ses dosyası yok, telif sorunu yok.

## Kontroller

### Bilgisayar

| Tuş | İşlev |
|---|---|
| WASD | Hareket |
| Fare | Nişan + ateş |
| Space | Atılma (dash) |
| Shift / sağ tık | Altıgen kalkan |
| Q | Özel hareket |
| E / R | Aletler |
| P / Esc | Duraklat |

### Telefon (dikey ekran)

- **Hareket:** Ekranın alt %60'ında herhangi bir yere dokun ve sürükle, joystick parmağının altında çıkar.
- **Ateş:** Parmağını kaldır ya da joystick'i ortada tut. Mecha görüş hattındaki en yakın düşmana kendiliğinden ateş eder. Hareket ederken ateş etmezsin; durmak daha güçlü ama daha riskli.
- **Dash:** Joystick'i hızlıca fırlat ya da iki kere dokun. 2 hakkın var, joystick'in üstündeki çubuklar dolunca yenilenir.
- **Kalkan:** Kendiliğinden çalışır. Güç 60'ın üstündeyken sana gelen ilk mermiyi durdurur. Işınları sadece yarıya indirir.
- **Özel hareket:** Sağ alttaki büyük buton, dolunca parlar. Üstündeki iki küçük buton aletler. Ayarlardan "Auto-use gadgets" açılabilir.
- **Perfect dodge (iki modda da):** Bir mermi sana çarpmak üzereyken dash atarsan zaman yavaşlar ve özel hareket barın %15 dolar.

Kontrol modu otomatik seçilir (dokunmatik cihaz = telefon modu). System menüsünden elle değiştirebilirsin.

## Bilgisayarında çalıştırma

Kurulum ya da build adımı yok. Giriş dosyası [`index.html`](index.html); oyun kodu `js/`, görünüm `css/` klasöründe.
Three.js bir CDN'den yüklenir, bu yüzden ilk açılışta internet gerekir.

En kolayı `index.html` dosyasını çift tıklayıp tarayıcıda açmak. Bazı tarayıcılar yerel dosyalarda kısıtlama
yapabilir; o zaman klasörde küçük bir sunucu başlat:

```bash
python -m http.server 8000
```

Sonra tarayıcıda `http://localhost:8000` adresini aç.

**Debug modu:** Adresin sonuna `?debug=1` eklersen sol altta bir panel çıkar: sonraki oda, odaya atla, yetenek/eşya ver,
ölümsüzlük, düşman ve boss çağır. `?debug=1&mobile=1` bilgisayarda telefon modunu zorlar. Kısayollar: `N` sonraki oda, `K` hepsini öldür, `G` ölümsüzlük, `L` koşu kaydı.

**Koşu kaydı ve denge simülasyonu (debug):** `L` tuşu her oda için süre, alınan/verilen hasar, kill, kaynağa göre altın/elmas, oyuncu güç tahmini ve
düşman çarpanını gösteren küçük bir panel açar; *Export JSON* kaydı kopyalanabilir metin olarak verir. *Sim* (ya da konsolda `DBG.sim({arena:2})`)
bir arenanın oda sırasını çizim yapmadan hesaplar ve zayıf/ortalama/güçlü build'ler için güç ile düşman eğrisini, koşu başına altın/elmas toplamlarını yazdırır.

## Lisans

[MIT](LICENSE). Kodu istediğin gibi kullanabilir, değiştirebilir ve paylaşabilirsin.
