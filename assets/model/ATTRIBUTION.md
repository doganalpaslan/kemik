# Model kaynağı ve lisansı

BodyParts3D, © The Database Center for Life Science, CC Attribution-Share Alike 2.1 Japan.

- [Özgün proje](https://lifesciencedb.jp/bp3d/)
- [Veri arşivi](https://doi.org/10.18908/lsdba.nbdc00837-000)
- Sürüm: BodyParts3D 3.0, 20110915, BodyParts3D_3.0_obj_95.
- [İndirilen STL dönüşümleri](https://github.com/Kevin-Mattheus-Moerman/BodyParts3D/tree/main/assets/BodyParts3D_data/stl)
- [CC BY-SA 2.1 JP](https://creativecommons.org/licenses/by-sa/2.1/jp/), yerel lisans metni: LICENSE.txt.
- Mitsuhashi N ve ark. BodyParts3D: 3D structure database for anatomical concepts. Nucleic Acids Research 2009;37:D782–D785. https://doi.org/10.1093/nar/gkn613

## Türetilmiş model

İşitme kemikçikleri dışındaki 200 erişkin kemiği temsil eden 202 kemik ağı ve bağlam için 28 diş ağı kullanılır. Ağ sayısının farkı, sternumun manubrium, gövde ve xiphoid olarak üç kaynak parçasından oluşmasıdır. Dişler soru değildir. Soru havuzu 51 birimdir; çift kemikler birlikte vurgulanır.

Kafatasının v1 sadeleştirmesi korunur: yaklaşık %28 üçgen hedefi ve %0,3 hata sınırı. Yeni STL dosyaları tek tek indirilir, köşeleri birleştirilir ve meshoptimizer 0.25.0 ile el/ayak için en fazla 700, diğer kemikler için 1400 üçgen hedefi ve %1,2 hata toleransıyla sadeleştirilir. Float32 konum ve Uint16 indisler 12 bölge dosyasına paketlenir. Manifest özgün kimlikleri ve adları korur. Toplam ikili veri 3.638.972 bayttır.

El ve ayak bölgelerinde iki tarafın kemikleri, kendi iç anatomik ilişkileri korunarak görünümde yan yana yaklaştırılır. Kaynak dünya konumları ikili dosyalarda korunur. Görüntüleme sırasında eksenler dönüştürülür. Sağ üst görünüm hedef kemiği komşularından ayırır; çift birimlerde tek tarafı başka açıdan büyütür.

## Sakrum ve koksiks ayrımı

Kaynak FMA16202 hem sakrumu hem koksiksi içerir; ayrı koksiks STL’si yoktur. Bu etiketleme sorunu [Clarkson ve Whipple, 2018, Şekil 5](https://pmc.ncbi.nlm.nih.gov/articles/PMC6371295/) tarafından da belgelenmiştir.

Ağın yan izdüşümünde görünen sakrokoksigeal birleşimde, kaynak z=828 mm düzleminde üçgen merkezlerine göre ayırma yapılır. Üst bölüm 16202, alt bölüm koksiksin FMA kimliği 20229 ile tutulur; manifestte bunun özgün bağımsız dosya olmadığı açıkça yazılıdır. Yeni anatomi geometrisi eklenmez. Sınır yaklaşık bir segmentasyondur ve hekim kontrolü gerektirir. Kesit yüzeyi kapatılmadığından yakın görünümde üst kenar açık olabilir.

İşitme kemikçikleri bu STL sürümünde bulunmadığı için sorulmaz. Tüm arşiv indirilmez. `npm install` ardından `python3 scripts/fetch-model.py` indirme, sadeleştirme ve paketlemeyi yürütür; her ham STL işlendikten hemen sonra silinir. `scripts/prepare-model.mjs`, geçici sadeleştirilmiş parçalardan paketleri yeniden birleştirir. /tmp altındaki ara veriler teslim sonunda temizlenmiştir.

Bu türetilmiş model aynı CC BY-SA 2.1 JP lisansı altındadır. Bu lisans, model dışındaki kaynak kodu için otomatik bir lisans beyanı değildir.

## Task 8 · güncel kapsam ve Z-Anatomy kemikçikleri

Yukarıdaki 51 birim ve kemikçiklerin sorulmadığı bilgisi v2 tarihçesidir. Güncel havuz **70 soru birimiyle standart 206 erişkin kemiğinin tamamını** kapsar. Sternumun üç parçası ayrı öğretilir, erişkin sayımında bir kemiktir. Dişler yalnız bağlamdır. BodyParts3D dosyaları ve malzemeleri korunmuştur.

- Ek kaynak: [Z-Anatomy / Lluís Vinent Juanico](https://github.com/LluisV/Z-Anatomy), model katkısı Gauthier Kervyn ve Z-Anatomy projesi. [Proje lisansı ve katkıcılar](https://github.com/LluisV/Z-Anatomy/blob/PC-Version/LICENSE) (yerel tam metin: `LICENSE-Z-ANATOMY.txt`), [model ve lisans açıklaması](https://github.com/LluisV/Z-Anatomy/blob/PC-Version/README.md).
- Dosya: `Resources/Models/FBX/SkeletalSystem100.fbx`, Git blob SHA-1 `7c62e45211bf3992bb7239170343e06e2b073865`. Yalnız `Malleusl/r`, `Incusl/r`, `Stapesl/r` adlı altı gerçek kemik ağı kullanılır. Etiket/işaret geometrileri alınmaz.
- Türetilmiş dosya: `ossicles.bin` (260.640 bayt), **[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)**. Diğer BodyParts3D dosyalarının 2.1 JP bildirimi korunur; bu yeni paketin lisansı 4.0'dır. Kaynak kodun lisansı hakkında beyan değildir.
- Değişiklikler: FBX dünya dönüşümleri uygulandı; yedi eş kafatası kemiğinin sınır kutularıyla tekdüze ölçek ve öteleme hesaplandı. Ölçek **9,687329837**, öteleme (FBX dünya eksenleriyle mm) **[−0,647520028; −13,808417041; 97,866864752]**. Sınır kutusu koordinatlarında RMS uyum hatası **0,4333 mm**. Bu değer anatomik doğrulama veya kulak içi yüzey eşleştirmesi değildir. Orta kulak yerleşimi hekim kontrolü listesinde tutulur.
- İlişkili altı kemiğin kendi konum/oranları korunur; yeni şekil uydurulmadı. Köşeler birleştirildi, Float32/Uint16 olarak eksen dönüşümüyle paketlendi. Ham FBX başarıyla işlenince silinir. Yeniden üretim: `node scripts/prepare-ossicles.mjs /tmp/z-skeleton.fbx`; dönüşüm tarifi `scripts/ossicles-alignment.json`.
- Kemikçik sorularında ana kamera temporal bölgeye, ikinci kamera tek kemikçiğe çok yakından bakar. Ekrandaki model notu bu sorularda Z-Anatomy lisansını gösterir. Ham indirme depoya dahil edilmez.

## Task 17 · kas modelleri

178 kas dersi için **413 BodyParts3D kaynak ağı** kullanıldı. Birim → kaynak FMA/BP kimliği, özgün İngilizce parça adı ve kaynak STL yolu `scripts/muscle-recipe.json` içinde kaydedildi. Kaynak ve lisans yukarıdaki BodyParts3D 3.0 / DBCLS / **CC BY-SA 2.1 Japan** bilgisidir; türetilmiş kas ikilileri de aynı lisans altındadır. `muscles-*.bin` dosyaları kaynak ağların birleştirilmiş, meshoptimizer ile en fazla yaklaşık 1400 üçgene indirilmiş türevleridir; float32 konumlar ve uint16 indekslerle saklanır. Özgün geometri üzerinde şekil uydurma veya anatomik kas icadı yapılmadı.

11 bölge dosyası gerektiğinde yüklenir. İskelet bağlamı mevcut kemik ikililerini tekrar kullanır. El ve ayakta kas ve kemiklere aynı yatay çeviri uygulanır. Tek kaynak ağda verilen çift gruplar, yakın görünümde bir tarafı seçmek için sagittal düzlemde üçgenlere göre ayrılır. Normal vektörleri tekrar hesaplanır; kırmızı/cam materyaller ve kamera kadrajları uygulama tarafından atanır. Kaynak STL dosyaları işlemden sonra silinir. Tam ders/grup kapsamı BITTI.md ve anatomi kaynakları KAYNAKLAR.md içindedir.


## Task 18 · Ek kas meshleri

- **BodyParts3D / DBCLS / Kousaku Okubo, CC BY-SA 2.1 Japan:** pelvis tabanı için 9 ek gerçek kaynak STL; bunlar `muscles-pelvis.bin` içinde mevcut parçalarla paketlendi. Üç grup dersinde önceden kullanılan meshler paylaşılır.
- **Z-Anatomy — The libre 3D atlas of anatomy / Gauthier Kervyn, Kousaku Okubo (BodyParts3D), Marcin Zielinski, Lluís Vinent Juanico, CC BY-SA 4.0:** [kaynak proje](https://github.com/LluisV/Z-Anatomy/tree/PC-Version), `Resources/Models/FBX/MuscularSystem100.fbx`, Git blob `2477e1b6caf97d7174762b5eec6cf1c80db64eed`. 41 gerçek mesh; özgün FBX nesne adları ve birim eşlemesi `scripts/muscle-recipe.json` içindedir. Türev **muscles-z-head.bin (324.072 bayt)** ve **muscles-z-neck.bin (347.952 bayt)** dosyaları [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) altındadır; yerel tam lisans `LICENSE-Z-ANATOMY.txt`.
- İşlemler: FBX dünya dönüşümü, mevcut kemikçik hizalama matrisinin aynı dünya koordinatlarındaki kaslara uygulanması, eksen dönüşümü, köşe birleştirme, gerekirse meshoptimizer ile yaklaşık 1400 üçgene sadeleştirme ve Float32/Uint16 paketleme. Doğrulama: `scripts/z-muscles-alignment.json`; üç bilinen kasın merkez farkı 0,18–0,40 mm. Yeniden üretim: `node scripts/prepare-z-muscles.mjs /tmp/z-muscles.fbx`, ardından `node scripts/assemble-muscles.mjs`; genel indirme komutu `python3 scripts/fetch-muscles.py` Z kaynağını da işler. Ham FBX başarıyla paketlenince silinir.
- Eksik geometri incelemesi: `VisceralSystem100.fbx` blob `355770ae46123044c85deca03de3fb880b8f7301`; [güncel Blender arşivi](https://github.com/Z-Anatomy/Models-of-human-anatomy) `Z-Anatomy.zip` blob `f43cabc6f366b2a6058dd2ed4a2b3c7b9b2492cb`. Bu iki kaynaktan bu görevde geometri alınmadı. Yalnız grup etiketi veya origo işareti olan nesneler kas yerine kullanılmadı; eksikler BITTI.md içindedir. İç kulak referans modelleri kullanılmadı.

## Task 19 · Baş/boyun bağlamı

[Z-Anatomy PC-Version FBX kaynakları](https://github.com/LluisV/Z-Anatomy/tree/PC-Version/Resources/Models/FBX), aynı katkıcılar ve **CC BY-SA 4.0**: `SkeletalSystem100.fbx` (blob `7c62e45211bf3992bb7239170343e06e2b073865`) içinden `Thyroid_cartilage`, `Cricoid_cartilage`, `Arytenoid_cartilager/l`; `VisceralSystem100.fbx` (blob `355770ae46123044c85deca03de3fb880b8f7301`) içinden `Trachea`; `NervousSystem100.fbx` (blob `4ec6e3cb2a1ba821aca02c1d523ac614fdf41a02`) içinden `Sclerar/l`, `Cornear/l`. `Eyeballj` bir etiket nesnesidir; bunun yerine gerçek sklera ve kornea yüzeyleri kullanılır. Dokuz yüzey `z-head-neck-context.bin` (215.528 bayt), CC BY-SA 4.0 içinde yalnız bağlam olarak paketlendi; ders/soru veya erişkin kemik sayısına eklenmez.

Yedi ortak kafatası/mandibula kemiğinin 14 min/max kutu noktasından, eksenleri zaten ortak olan koordinatlarda tekdüze ölçek + öteleme (dönme birim matris) yeniden hesaplandı. Sonuç eski kemikçik/kas dönüşümüyle aynı olduğundan kas ikililerini tekrar taşımak gerekmedi: ölçek **9,687329837147987**, öteleme **[−0,647520028; −13,808417041; 97,866864752]**. Nokta başına **3B RMS 0,750488 mm**, koordinat başına RMS **0,433294 mm**, en büyük nokta farkı **1,975379 mm**. Fit dışında tutulan hyoidin min/max farkları **1,086068 / 1,088960 mm**. Bunlar kutu ekstremumlarına dayanan uyum ölçüleridir; eş anatomik yüzey noktalarının hatası veya klinik doğrulama değildir. Tüm noktalar, kaynak kimlikleri ve artıklar `scripts/head-neck-alignment.json` içinde saklanır.

FBX dünya matrisi, aynı kayıt dönüşümü, eksen paketlemesi, köşe birleştirme ve en çok yaklaşık 2000 üçgene sadeleştirme uygulandı. Trakeanın yalnız üst yaklaşık 45 mm'lik kısmıyla kesişen gerçek üçgenleri tutuldu; kesit düzeyindeki üçgenler yüzünden tam kutu yüksekliği yaklaşık 48,4 mm'dir. Yeni şekil veya tahmini küre üretilmedi. BodyParts3D kafatası, mandibula, hyoid ve servikal omurlar mevcut 2.1 JP ikililerinden okunur. Kaslar kırmızı, komşu göz kasları çok soluk cam, göz küresi ve iskelet/kıkırdaklar gri camdır. Yeniden üretim: üç FBX'i indirip `node scripts/prepare-head-neck-context.mjs /tmp/v19-skeleton.fbx /tmp/v19-visceral.fbx /tmp/v19-nervous.fbx` çalıştırın; ham dosyalar başarılı paketlemeden sonra silinir.

## Task 22 · Kemik landmark anchor ve yüzey yamaları

58 üst ekstremite landmark'ı için [Z-Anatomy Models-of-human-anatomy](https://github.com/Z-Anatomy/Models-of-human-anatomy/blob/master/Z-Anatomy.zip) içindeki `Startup.blend` kullanıldı (zip blob `f43cabc6f366b2a6058dd2ed4a2b3c7b9b2492cb`). Z-Anatomy / Gauthier Kervyn ve katkıcıları, BodyParts3D / Kousaku Okubo, Marcin Zieliński, Lluís Vinent Juanico; anchor türevleri **CC BY-SA 4.0**, yerel lisans `LICENSE-Z-ANATOMY.txt`. Hook uygulanmış etiket uçlarının çıkarılması, eksen/ölçek kaydı, sağdan sola aynalama ve yüzeye projeksiyon yapıldı. 58 konum Z verisinden, 0 konum sıfırdan el ile; bütün yüzey yama boyutları ve skapula kenar şeritleri el ile tanımlanmıştır.

Kemik yüzeyi mevcut BodyParts3D **CC BY-SA 2.1 JP** dosyasıdır. `landmarks-upper.json` içindeki üçgen seçimleri bu gerçek yüzeyi referanslar; kırmızı overlay, çentik sınırı ve ince pin görüntüleme katmanıdır. Ayrı, gerçek landmark meshleri oldukları iddia edilmez. Tam kaynak, dönüşüm, lisans ayrımı ve yeniden üretim KAYNAKLAR.md / Task 22; bütün ham uçlar ve fit artıkları `scripts/landmarks-alignment.json` içindedir. Bir aday, incisura scapulae, basitleştirilmiş yüzeyde belirsiz çentik nedeniyle soru havuzundan çıkarıldı.

## v29 skull re-derivation

The sphenoid (52736) and occipital (52735) surfaces now derive from Z-Anatomy's original `SkeletalSystem100.fbx`, blob `7c62e45211bf3992bb7239170343e06e2b073865`, CC BY-SA 4.0. Attribution: Z-Anatomy contributors, Gauthier Kervyn, Lluís Vinent Juanico, Marcin Zieliński, and the underlying BodyParts3D / DBCLS / Kousaku Okubo work. Other skull surfaces retain the BodyParts3D CC BY-SA 2.1 Japan terms above. These are adapted, registered and selectively simplified meshes, with no synthetic holes or hole filling. Per-file hashes and licenses: `scripts/data/skull-sources-v29.json`; per-mesh derivation: `scripts/data/skull-mesh-audit-v29.json`. Source nonmanifold edges are retained; they are not repaired by inventing geometry. `skull.bin` contains both sources; the corresponding share-alike terms apply to each source's derived meshes. Original upstream attribution and license links above continue to apply.

## Task 30: nerves and vessels

NervousSystem100.fbx (blob `4ec6e3cb2a1ba821aca02c1d523ac614fdf41a02`) and CardioVascular41.fbx (blob `aa5bbcb63ae6e9ace8051111b3a85ea87f00c4f3`) from [LluisV/Z-Anatomy, PC-Version](https://github.com/LluisV/Z-Anatomy/tree/PC-Version/Resources/Models/FBX). Z-Anatomy by Gauthier Kervyn, Lluís Vinent Juanico and contributors, based in part on BodyParts3D / Anatomography, © DBCLS. These adapted surfaces remain licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

Changes: world transforms applied; existing skeleton similarity registration (scripts/head-neck-alignment.json); welded position vertices; meshoptimizer simplification with a 65% target, strict 0.0001 relative geometric error and locked open borders; indexed Float32/Uint16 regional packing. No procedural replacement anatomy. `scripts/data/neurovascular-provenance.json` records hashes and registration. Each `znv-*` manifest entry retains its source filename, exact object name and source triangle count. The two committed TSV files map every unit to source objects. Raw source FBX files are temporary and removed after preparation. Reproduce with `node scripts/prepare-neurovascular.mjs` (downloads only those two source files, verifies Git blob hashes, packs, then deletes raw files).


## Task 32 organs and brain

`organs-*.bin` and `brain-*.bin` are adapted indexed surfaces from Z-Anatomy (LluisV, CC BY-SA 4.0) and BodyParts3D (Database Center for Life Science, CC BY-SA 2.1 JP). Source filenames, object IDs, licenses and triangle counts are retained per mesh in manifest.json. Exact upstream Git blobs / SHA-256 hashes and BP3D commit are in scripts/data/viscera-provenance.json; the TSVs map each teaching unit to source objects. Brain sinus meshes reuse the same licensed upstream anatomy as the vessels module. Composite parent units group real surfaces; no synthetic structure, hole, valve or female organ is fabricated.

Adaptation: the existing head-neck scale/translation registration; FBX world XYZ mapped to BP3D X,-Z,Y; BP3D STL coordinates retained; merge coincident vertices, topology-locked meshoptimizer simplification (6000 target indices, max relative error 0.003). Fine ducts, bronchi, lacrimal canaliculi and zonules use 65% target indices and 0.0001 error. Raw downloaded files are deleted by prepare-viscera.mjs. No clinical accuracy certification is implied.
