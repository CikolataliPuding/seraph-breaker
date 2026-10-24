# Seraph Breaker

Anime tarzı bir mecha aksiyon roguelite oyunu. Tarayıcıda çalışır, kurulum gerektirmez.
Mavi, kırmızı ve yeşil mechalarla şehri makinelere ve meleklere karşı savunuyorsun.
Bilgisayarda ve telefonda ayrı, kendine özgü kontrollerle oynanır.

**Hemen oyna:** https://selameddin00.github.io/seraph-breaker/

Bu proje bir topluluk projesi. Oyunun fikri arkadaş grubumuzdan çıktı; herkes istediği
özelliği ekleyebilir, istediği şeyi değiştirebilir. Nasıl katkı vereceğin
[CONTRIBUTING.md](CONTRIBUTING.md) dosyasında.

## Oyunda neler var

- **5 arena, her biri tek koşu:** Outer City (30 oda), Night Harbor (40), Heaven's Gate (50), Fallen Sky (50) ve Main Stage (15 oda + boss). İlk dört arenada odalar kısa, Archero tarzı: çoğu tek dalga.
- **Main Stage:** Beta süresince kilitli: System ekranındaki *Main Stage access code* alanına erişim kodu girilince açılır (kodu proje sahibinden iste; repoda sadece SHA-256 özeti var, kod kayıtta durur ve *Reset my progress* ile silinmez). Kod tester kodundan ayrı: sadece sahneyi açar, test araçlarını açmaz. Kod yokken haritada *LOCKED · BETA* yazar. Fallen Sky'dan bir kademe zor. High-Co'nun gece festivali: koyu sahne zemini, dev ekranlar, hoparlör kuleleri, pembe ve kehribar ışıklar, kenarda kalabalık. Robot yok, kadro tamamen insan (`docs/main-stage.html`). 15 odanın hepsi dalga odası: kapılardan dalgalar girer, dalga bitince 3-4 saniye mola (HUD'da sayaç ve dalga numarası), son dalga bitince kapı açılır. Dalga sayısı 3'ten 7'ye, kalabalık hem oda içinde hem odadan odaya büyür. Dalgalar bestiyerin kompozisyonları: ilk odalar *Sound check* (tek grup üyesi + sahne ekibi), ortada *Moshpit* sürüleri, son odalar *Encore* ile biter (dört müzisyen aynı anda sahnede). 15. odadan sonra tek boss High-Co.
- **High-Co, üç form:** Her formun kendi can barı var, biri ölünce sıradaki sahneye iner; sadece üçüncü formun ölümü boss kill sayılır. *White* (beyaz, ateşli frontman, paraşütle sinematik iniş): en sert vuran form, kısa nefes payları. *Black Angel* (siyah kanatlı melek, ışık sütunundan iner): daha yumuşak vurur ama kalabalıktan güç çeker: kalabalık bölümlerinden ona ışık akıntıları akar ve canını doldurur. Kanal sırasında ona vurdukça akıntılar kopar, üçü de kopunca sendeler ve fazla hasar alır; iyileşme form başına %25 ile sınırlı. *Red Rage* (kırmızı kanatlı öfke): White'ın hasarı + Black Angel'ın iyileşmesi, daha hızlı tempo. Form geçişlerinde mermiler silinir, yeni form inene kadar dokunulmazdır.
- **Ritim senkronu (Main Stage kuralı):** Bütün mob saldırıları canlı müziğin vuruşuna kilitli. Vuruşta atılan dash'in mükemmel kaçış penceresi iki kat geniş; HUD'daki pembe nokta her vuruşta yanar, vuruşta dash atınca patlar. Baterist yaşadıkça grubun temposu (ve müzik) %15 hızlanır. Ses kapalıysa ya da tarayıcı sesi askıya aldıysa ritim kendi saatine geçer.
- **Main Stage kadrosu:** Grup: Pulse Dancer (her ikinci vuruşta pembe pistine ışınlanır, 8 notalık halka açar, eşarpları mermi savurur), Baterist (tabureden kalkmaz, kick şok halkası; her ölçüde haritaya kırmızı daireler düşer, gökten meteorlar vuruşta iner), Shredder (ses dalgası konisi, 3 saniyelik şimşek solosu, sonra 1 saniye kafa sallar ve açık kalır), Bass Brute (alt frekans halkaları içinde %35 yavaşlarsın, dash geç dolar; menzile girince kırmızı V koni ile kafa sallar). Sahne: Roadie (amfi kurar, amfiler vuruşta ses darbesi atar ve 10 saniye yaşar, tek atışta kırılır), Mosher (6-10'luk sürüler, iter; köşeye sıkışınca zincirler acıtır), Pyro Tech (elinde havai fişek, mesafesini korur; turuncu çizgi tell, sonra vuruşta iki fişek atar, bloklar durdurur), Işıkçı (takip spotu: içinde durursan her vuruşta yakar ve bütün düşman mermileri %25 hızlı ve isabetli), Stage Diver (arena dışından atlar ve durmadan sıçramaya devam eder: iniş yeri kısa süre önce kırmızı halka, inişte ezme dalgası, 0.6 saniye sersem). Main Stage'de level cap 30 (oda 12-13 civarı, HUD'da MAX LVL) ve High-Co'dan önce %50 backstage tamiri var.
- **Oda düzeni ve tempo:** Her 10 odalık blok bir bossla biter ve gerilim dalga dalga yükselir: bosstan sonra nefes odası, ilk sıçrama (pusu, takviye ya da tuzak koridoru), 5. odada melek, tırmanış, 7. odada elit ya da av, zor oda (hayatta kal, karanlık oda...) ve 9. odada sıradaki bossun saldırılarını küçük versiyonlarla öğreten bir oda. Bosslar önceden planlanır, aynı boss arka arkaya gelmez. Koşunun planı kayıtla birlikte saklanır, devam edince aynı odalar gelir.
- **Oda tipleri:** *Pusu* (yanlardan ve arkadan gelirler), *Takviye* (dalgalar kapılardan girer), *Hayatta kal* (20 saniye boyunca sonu gelmeyen düşmanlara dayan), *Av* (kaçan bir elit, süre bitince kaçar), *Tuzak koridoru* (az düşman, çok tuzak), *Karanlık oda* (sadece yakınını görürsün; saldırmaya hazırlanan düşmanlar yine görünür).
- **Oda kompozisyonu:** Rastgele seçim yok: her savaş odasında seni hareket ettiren bir düşman (hücumcu, topçu, alan kapatan, yere vuran) ve dikkat isteyen bir düşman (keskin nişancı, destek) mutlaka var. Şablonlar arenaya göre `COMPS`'ta.
- **Elit nitelikleri:** Her elit 1-2 nitelikle gelir ve adı üstünde yazar: *Swift* (hızlı), *Shielded* (kalkanlı), *Volatile* (ölünce patlar), *Blinker* (ışınlanır), *Summoner* (yardımcı çağırır). Corrupted elitler 1 nitelik alır.
- **Tuzaklar:** Haritadaki `~` hücreleri artık üstünden yürünen tuzaklar: Outer City'de testere rayları, Night Harbor'da diken karoları, Heaven's Gate'te kutsal ışık sütunları, Fallen Sky'da karışık. Diken ve sütunlar önce yanıp söner, sonra vurur. Tuzaklar düşmanlara da vurur; düşmanlar kurulu tuzağa kendi isteğiyle girmez ama geri tepmeyle içine atılabilir.
- **Kalıcı güçlenme:** Yetenekler, pilot seviyesi ve eşyalar bütün koşu boyunca kalır, ölünce ya da arena bitince sıfırlanır. Toplanan altın ve elmas her zaman sende kalır.
- **Koşu kaydı:** Her temizlenen odadan sonra koşu kaydedilir. Uygulamayı kapatsan bile hangardan **Continue run** ile kaldığın odadan devam edersin.
- **Arena kuralları:** Night Harbor'da düşman mermileri %15 hızlı, Heaven's Gate'te elitler ikili gelir, Fallen Sky'da iki taraf birlikte gelir, elitler corrupted olur ve her koşuya 2 rastgele modifier eklenir. 2. arenadan itibaren bazı odalarda ateş menfezleri ve çöken zeminler var.
- **Yetenek ruleti:** Level atlayınca 3 kart slot makinesi gibi döner. Nadirlikler: Common (saf stat), Rare (mermi değiştiriciler, öldürünce tetiklenenler), Epic (orbitler, mekaniğe özel), Legendary (evrimler). Sahip olduğun yetenekler daha sık gelir, yükseltilebilecek bir yeteneğin varsa kartlardan biri mutlaka yükseltmedir. Koşu başına 1 reroll. Yeni bir dokunuş ya da tuş basışı dönüşü atlar (basılı tutulan tuş atlamaz). Bilgisayarda `1/2/3` kart seçer, `R` reroll. Level atlamaları savaşın ortasında açılmaz: XP çubuğunda "LEVEL READY" işareti yanar, seçimler oda temizlenince (boss odasında boss ölünce) kapı açılmadan önce sırayla gelir.
- **Evrimler:** Twin Shot + Rapid Cycle → Bullet Storm, Burn Rounds + Orbit Blades → Inferno Ring, Chain Spark + Bolt Orbit → Storm Halo, Vampiric Core + Rage → Blood Engine. İki yetenek de maksimumdayken teklif edilir.
- **Melek ve şeytan:** Melek tamir ya da yetenek verir. Hasar almadan temizlenen odalardan sonra şeytan gelebilir: Glass Cannon, Berserk, Greed ya da Brittle lanetlerinden biri karşılığında güç verir. İstersen "Walk away" diyebilirsin.
- **Eşyalar:** Elitler %25, bosslar her zaman eşya düşürür. 4 slot var, dolunca hangisini bırakacağını seçersin. Plated Core, Servo Boots, Capacitor, Mine Layer, Thorn Plating, Halo Fragment, Overclock Chip, Lucky Coin ve daha fazlası.
- **Düşmanlar:** Drone, Heavy, Seraph, Warden ve yeni gelenler: Spark, Crawler, Howitzer, Lancer, Bulwark, Shardling, Cherub, Censer, Ophan. Her saldırının okunabilir bir uyarısı var. Mermiler bloklardan geçmez; sadece Censer küreleri havada süzülür (gölgesi ve dalış noktası görünür).
- **Düşman yapay zekası:** Düşmanlar odanın yol haritasını (flow field) kullanıp blokların ve kurulu tuzakların etrafından dolaşır, seni görmeden ateş etmez, görmek için açık bir yere geçer. Her birinin bir rolü var: Drone mesafe tutar, Lancer açık hat arar, Heavy üstüne yürüyüp yere vurur, Seraph ve Ophan nereye gideceğini tahmin edip uyarılı bir hücumla kilitlenir, Crawler bir yöne dönüp yanına ve arkana dolanır ve atışlar arasında siper alır, Howitzer yerinde duranı cezalandırır, Cherub öndeki düşmanın arkasında durur, Spark yaklaşınca 0,55 saniyelik fitilini yakar. Aynı anda sadece birkaç düşman saldırır (saldırı jetonları), diğerleri etrafına yayılır. Arena 1 saf, Arena 4 seni okur (öne nişan alır, dash'in dolarken bastırır).
- **Hareket ve animasyon:** Ağır düşmanlar yavaş hızlanıp yavaş durur, mechalar önce döner sonra yürür, ayaklar kaymaz; Heavy ve Iron Colossus adımlarında toz kalkar ve ekran hafif sarsılır. Crawler örümcek gibi çapraz bacak çiftleriyle koşar, melekler dönüşlerde yatar, Spark gerçekten yuvarlanır ve duvardan seker. Drone, Heavy, Seraph ve Warden'ın modelleri yenilendi; %50 ve %25 zırhın altında parçaları kopar.
- **Boss tekrarı:** Bir boss odasında ölürsen sonuç ekranında *Retry boss* çıkar: koşu, boss odasına girdiğin andaki haliyle (zırh, build, yetenekler, eşyalar, koşu altını/elması) geri gelir ve boss baştan başlar. Başarısız denemede toplanan altın/elmas geri alınır, ödüller ve ilk bitirme bonusu bir kez verilir. Diğer seçenek *Return to base*.
- **Bosslar:** Saldırıları üst üste binmez: her saldırı (füzeleri inip şok dalgaları bitene kadar) tamamlanınca kısa bir nefes payı gelir, ağır saldırı sırasında çağrılan minyonlar ateş etmez. Füzeler havadan gelir: gölgesi ve iniş noktasında kırmızı işaret olur. Şok dalgalarının erişimi yerde kırmızı halkayla, geri sayımı dolan diskle gösterilir; dalganın içinden dash atarsan hasar almazsın (perfect dodge). Iron Colossus, Prism Angel, The Last Seraph, Hive Carrier, Siege Arachne, Ophanim Throne, Archon ve **High-Co**. High-Co sadece Main Stage'in sonunda, bir konser sahnesinde savaşır (Fallen Sky havuzunda yok, corrupted sürümü de yok): paraşütle iner, %66 canda yerine siyah kanatlı bir melek iner, %33'te öfke moduna girer (kırmızı kanatlar, ışık sütunları). Metal Çığlık bütün odayı vurur, sadece amfilerin arkası güvenlidir. Formlar arasında grup üyeleri sahneye döner (faz II: Bass Brute ve Pulse Dancer, faz III: Shredder ve Baterist). Her bossun sinematik girişi var. High-Co dışında her birinin bir de **Corrupted** sürümü var: mor renk, kristal dikenler, başka bir bosstan ödünç saldırılar.
- **3 birim:** Azure (hızlı tüfek), Crimson (saçma topu), Verdant (delici mızrak). Her birinin kendi özel hareketi var.
- **Kalıcı ilerleme:** Altınla **Core** statları (Armor, Damage, Power regen; her biri 30 seviye) ve yetenek ağacı, elmasla 6 silah ve 7 alet. Kayıt tarayıcıda tutulur, eski kayıtlar da açılır. En yüksek açık arenanın altındaki bir arenayı tekrar oynarsan ödüller azalır (bir alt arena %60, iki ve daha alt %30); büyük elmas ödülü sadece ilk temizlemede. Bu güncellemeden önce oluşturulmuş kayıtlar **BETA TESTER** rozeti alır; System'deki *Reset my progress* ilerlemeyi siler, rozeti bırakır.
- **His:** Vuruşlarda kısa donma (hitstop), geri tepme, düşmanlar parçalarına ayrılarak ölür, mechalar harekete eğilir.
- **Müzik:** Tarayıcıda canlı üretilen metal müzik. Ses dosyası yok, telif sorunu yok. High-Co'nun her formu için bir parça yuvası hazır (`js/data.js` içinde `BOSSES.highco.tracks`): dosyaları `assets/audio/` klasörüne koyup `src`, `bpm` ve `offset` (dosya başından ilk vuruşa saniye) doldurulunca form değişiminde parçalar arası geçiş yapılır ve vuruş saati o parçanın BPM'ini izler. Yuva boşken canlı müzik çalar. Adresin sonuna `?mute=1` eklenirse o sayfada müzik ve efektler susar.

## Kontroller

### Bilgisayar

| Tuş | İşlev |
|---|---|
| WASD | Hareket |
| Fare | Nişan + ateş (savaşta imleç yerine nişangah: düşman üstünde kırmızı, vuruşta X, Rail dolum halkası, Crimson saçılma genişliği) |
| Space | Atılma (dash) |
| Shift / sağ tık | Altıgen kalkan |
| Q | Özel hareket |
| E / R | Aletler |
| P / Esc | Duraklat (tüm build detaylarıyla) |
| 1 / 2 / 3, R | Seçim ekranında kart seç, reroll |

### Telefon (dikey ekran)

- **Hareket:** Ekranın alt %60'ında herhangi bir yere dokun ve sürükle, joystick parmağının altında çıkar.
- **Ateş:** Parmağını kaldır ya da joystick'i ortada tut. Mecha görüş hattındaki en yakın düşmana kendiliğinden ateş eder. Hareket ederken ateş etmezsin; durmak daha güçlü ama daha riskli.
- **Dash:** 2 hakkın var, joystick'in üstündeki çubuklar ve DASH butonundaki halka dolunca yenilenir. Yönü sen seçersin, otomatik nişanın kilitlendiği düşman asla değil: yürürken sağ alttaki **DASH** butonuna bas (joystick yönüne atar), dururken butondan istediğin yöne sürükle (sürüklediğin yöne atar), joystick basılıyken diğer başparmağınla ekrana dokun (joystick yönüne), iki kere dokunup ikinci dokunuşta kaydır (kaydırdığın yöne) ya da joystick'i hızlıca fırlat. Yön vermeden basarsan en son yürüdüğün yöne atar; mechanın altındaki küçük ok bunu gösterir.
- **Kalkan (Barrier):** Varsayılan *Auto*: güç 60'ın üstündeyken sana gelen ilk mermiyi durdurur (dolu bar 2 blok). Etrafında dönen soluk altıgen halka ve HUD'daki 2 çubuk hazır blokları gösterir, blokta halka parlar, son blok gidince kırılır. Işınları sadece yarıya indirir. Ayarlardan *Mobile shield: Manual* seçilirse sağ altta basılı tutulan bir kalkan butonu çıkar, bilgisayardaki yönlü altıgen kalkan gibi çalışır.
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

**Tester modu:** Test araçları bir tester koduyla açılır (proje sahibinden iste). System ekranındaki *Tester code* alanına kodu gir; repoda sadece kodun SHA-256 özeti tutulur.
Kod geçerliyse *Tester tools in game* açılabilir ya da adresin sonuna `?debug=1` eklenir; kod olmadan `?debug=1` hiçbir şey açmaz. Sol alttaki panel: sonraki oda, herhangi bir arena ve odadan başla,
Core seviyeleri, ağacı doldur/sıfırla, yetenek/eşya ver, ölümsüzlük, düşman ve boss çağır, ölçüm. `?debug=1&mobile=1` bilgisayarda telefon modunu zorlar. Main Stage için konsolda `DBG.stage(n)` (n. odadan başla), `DBG.wave(n)` (bu odanın n. dalgası), `DBG.spawn('shredder')` (herhangi bir mob), `DBG.hcForm(n)` (High-Co'yu n. forma atla), `DBG.hcHp(0.1)` (formun canını ayarla), `DBG.hcRegen()` (kalabalık iyileşmesini aç/kapat), `DBG.hcTrack(i)` (form parçasını zorla), `DBG.hcSim()` (iyileşme sınırı ve dövüş süresi tablosu), `DBG.die()` (olduğun yerde öl), `DBG.bpm(140)` (BPM'i zorla, `0` müziğe döner) ve `DBG.stageCurve()` (dalga/oda eğrisi tablosu); panelde de var. Denge testi için `DBG.solo('pyro')` (mob tek başına), `DBG.level(30)`, `DBG.overlay()` ya da `O` (level, XP, oda başına zırh kaybı) ve `await DBG.stageCheck()` (otopilotla ortalama/usta profil, oda başına zırh kaybı, ölüm şansı, zorluk skoru). Kısayollar: `N` sonraki oda, `K` hepsini öldür, `G` ölümsüzlük, `L` koşu kaydı.
Test araçlarının dokunduğu koşular işaretlenir (sonuç ekranında da yazar) ve ileride bir sıralama gelirse oraya asla gönderilmez.

**Koşu kaydı ve denge simülasyonu (debug):** `L` tuşu her oda için süre, alınan/verilen hasar, kill, kaynağa göre altın/elmas, oyuncu güç tahmini ve
düşman çarpanını gösteren küçük bir panel açar; *Export JSON* kaydı kopyalanabilir metin olarak verir. *Sim* (ya da konsolda `DBG.sim({arena:2})`)
bir arenanın oda sırasını çizim yapmadan hesaplar ve zayıf/ortalama/güçlü build'ler için güç ile düşman eğrisini, koşu başına altın/elmas toplamlarını yazdırır.
*Measure arena* (ya da `DBG.measure({arena:1})`) arenayı otomatik pilota oynatır (hızlandırılmış, çizimsiz; mermiye ve uyarılara bir insan gibi 0,3 sn gecikmeyle tepki verir, kartları rastgele seçer)
ve arena başına hasar almadan geçilen savaş odası oranını, oda başına süreyi ve dakikada altını raporlar. Koşu kaydı paneli de aynı özeti canlı gösterir.

## Lisans

[MIT](LICENSE). Kodu istediğin gibi kullanabilir, değiştirebilir ve paylaşabilirsin.
