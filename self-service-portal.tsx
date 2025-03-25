"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  ArrowRight,
  ChevronRight,
  Home,
  Phone,
  Search,
  Shield,
  User,
  Menu,
  X,
  ArrowUpRight,
  MessageSquare,
  HelpCircle,
  CreditCard,
  Settings,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  ArrowRightCircle,
  ThumbsDown,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  ArrowUp,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

// Logo bileşenini oluşturalım (gerçek logo yerine geçici olarak)
function Logo() {
  return (
    <div className="flex items-center">
      <Image
        src="https://www.agaranti.com.tr/wp-content/uploads/2023/02/agaranti-Arena.png"
        alt="A-Garanti Logo"
        width={120}
        height={30}
        className="h-8 w-auto"
      />
    </div>
  )
}

// Sorun giderme veri modeli
// Her sorunun birden fazla çözüm adımı olabilir
type SolutionStep = {
  id: string
  content: string
  isLastStep: boolean
}

type Problem = {
  id: string
  question: string
  category: string
  solutionSteps: SolutionStep[]
  relatedProblems?: string[] // İlgili diğer sorun ID'leri
}

// Sorun veritabanı
const problemsDatabase: Problem[] = [
  {
    id: "thomson1",
    question: "Thomson Smart TV'mdeki girişleri nasıl değiştirebilirim?",
    category: "thomson",
    solutionSteps: [
      {
        id: "thomson1-1",
        content:
          "Uzaktan kumanda üzerindeki SOURCE (KAYNAK) düğmesine basın ve yukarı/aşağı düğmelerini kullanarak istediğiniz girişe geçin.",
        isLastStep: true,
      },
    ],
    relatedProblems: ["thomson2", "thomson16"],
  },
  {
    id: "thomson2",
    question: "Thomson Smart TV'yi çalıştırmak için hangi bağlantılara ihtiyacım var?",
    category: "thomson",
    solutionSteps: [
      {
        id: "thomson2-1",
        content:
          "Canlı TV programlarını izlemek için Thomson Smart TV'nizin bir uydu veya karasal antene ya da bir kablo ağına bağlı olması gerekir.",
        isLastStep: false,
      },
      {
        id: "thomson2-2",
        content:
          "Tam Smart TV deneyiminin keyfini çıkarmak istiyorsanız, Thomson Smart TV'nizi bir Wi-Fi veya LAN kablosu aracılığıyla İnternet'e bağlamanız gerekir.",
        isLastStep: false,
      },
      {
        id: "thomson2-3",
        content:
          "Ses cihazları ve USB cihazları gibi isteğe bağlı bağlantılar hakkında bilgi için lütfen kurulum kılavuzuna veya kullanım kılavuzuna bakın.",
        isLastStep: true,
      },
    ],
    relatedProblems: ["thomson3", "thomson16"],
  },
  {
    id: "thomson3",
    question: "Thomson Smart TV'mde bir USB sürücüdeki medya dosyalarını nasıl oynatabilirim?",
    category: "thomson",
    solutionSteps: [
      {
        id: "thomson3-1",
        content: "Thomson Smart TV'nin USB bağlantı noktasına harici bir USB sürücü bağlayın.",
        isLastStep: false,
      },
      {
        id: "thomson3-2",
        content: "Önceden yüklenmiş multimedya oynatıcı uygulaması MMP'yi açın ve oynatmak istediğiniz dosyayı seçin.",
        isLastStep: false,
      },
      {
        id: "thomson3-3",
        content: "Oynatmayı başlatmak için OK düğmesine basın.",
        isLastStep: false,
      },
      {
        id: "thomson3-4",
        content:
          "Multimedya dosyalarını oynatmak için önceden yüklenmiş MMP multimedya oynatıcıyı kullanabilir veya Google Play'den başka bir multimedya oynatıcı indirebilirsiniz.",
        isLastStep: true,
      },
    ],
    relatedProblems: ["thomson13", "thomson15"],
  },
  {
    id: "thomson4",
    question: "Thomson Smart TV'min depolama kapasitesini artırabilir miyim?",
    category: "thomson",
    solutionSteps: [
      {
        id: "thomson4-1",
        content:
          "Evet, harici depolama alanı olarak kullanmak için bir USB bellek veya sabit sürücü bağlayıp takarak depolama kapasitesini artırabilirsiniz.",
        isLastStep: false,
      },
      {
        id: "thomson4-2",
        content: "Harici belleğe yalnızca birkaç uygulamanın taşınabileceğini lütfen unutmayın.",
        isLastStep: true,
      },
    ],
    relatedProblems: ["thomson13", "thomson15"],
  },
  {
    id: "thomson5",
    question: "Google Asistan'ı nasıl kullanabilirim?",
    category: "thomson",
    solutionSteps: [
      {
        id: "thomson5-1",
        content:
          '"OK Google" işlevini kullanmak istiyorsanız, uzaktan kumanda üzerindeki Google Asistan düğmesine basın.',
        isLastStep: false,
      },
      {
        id: "thomson5-2",
        content:
          'Google Asistan düğmesine ilk kez bastığınızda, ekranda "OK Google" işlevini etkinleştirmeniz istenecektir.',
        isLastStep: false,
      },
      {
        id: "thomson5-3",
        content:
          "Bu işlev çeşitli bilgileri, multimedya içeriklerini veya videoları doğrudan Android TV ana ekranında aramanızı sağlar.",
        isLastStep: true,
      },
    ],
    relatedProblems: ["thomson16", "thomson19"],
  },
  {
    id: "thomson6",
    question:
      "Bazen uygulamam (Netflix, Prime Video vb.) normal şekilde başlamıyor veya 'Oynatma şu anda mümkün değil' mesajını görüntülüyor. Bu sorunu nasıl çözebilirim?",
    category: "thomson",
    solutionSteps: [
      {
        id: "thomson6-1",
        content:
          "Belirli uygulamaların aynı kimlik bilgileriyle eşzamanlı kullanımı belirli sayıda cihazla sınırlı olabilir. Lütfen bu uygulamayı diğer cihazlarda kapatın ve uygulamayı Thomson Smart TV'de tekrar açmayı deneyin.",
        isLastStep: false,
      },
      {
        id: "thomson6-2",
        content:
          "İsteğe bağlı çok kullanıcılı uygulamada oturum açmak için lütfen doğru kullanıcıyı seçtiğinizden emin olun.",
        isLastStep: true,
      },
    ],
    relatedProblems: ["thomson11", "thomson23"],
  },
  {
    id: "thomson7",
    question: "Google hesabımı nereye girebilirim?",
    category: "thomson",
    solutionSteps: [
      {
        id: "thomson7-1",
        content:
          "İlk kurulum sırasında Google hesabınızla oturum açmadıysanız, daha sonra Ayarlar / Hesaplar ve oturum açma menüsünden de oturum açabilirsiniz.",
        isLastStep: true,
      },
    ],
    relatedProblems: ["thomson16", "thomson20"],
  },
  {
    id: "thomson8",
    question: "Yazılım güncellemesini nasıl yaparım?",
    category: "thomson",
    solutionSteps: [
      {
        id: "thomson8-1",
        content: "Thomson Smart TV'niz için yazılım güncellemeleri otomatik olarak gerçekleştirilir.",
        isLastStep: false,
      },
      {
        id: "thomson8-2",
        content:
          "Yüklü uygulamalar için güncellemeler mevcut olduğunda, ana ekranda bir bildirim alırsınız. Bu bildirime gidin ve okumak için Tamam düğmesine basın.",
        isLastStep: true,
      },
    ],
    relatedProblems: ["thomson24", "thomson16"],
  },
  {
    id: "thomson9",
    question: "Kullanabileceğim bir internet tarayıcısı var mı?",
    category: "thomson",
    solutionSteps: [
      {
        id: "thomson9-1",
        content: "Evet, ancak Google Play Store'dan bir tarayıcı uygulaması indirmeniz gerekiyor.",
        isLastStep: true,
      },
    ],
    relatedProblems: ["thomson20", "thomson24"],
  },
  {
    id: "thomson10",
    question: "Thomson Smart TV'm için garanti koşulları nelerdir?",
    category: "thomson",
    solutionSteps: [
      {
        id: "thomson10-1",
        content:
          "Tüm ürünlerimiz için üç yıllık garanti süresi sunuyoruz. Bu nedenle Thomson Smart TV'nizin garanti süresi satın alma tarihinden itibaren 24 aydır.",
        isLastStep: true,
      },
    ],
    relatedProblems: [],
  },
  {
    id: "thomson11",
    question: "Seçilen uygulama başlamıyor veya başlaması çok uzun sürüyor. Bu hatayı nasıl düzeltebilirim?",
    category: "thomson",
    solutionSteps: [
      {
        id: "thomson11-1",
        content:
          'Uygulamayı yeniden başlatmak için iptal edin. Bunu yapmak için şuraya gidin: Ayarlar / Uygulamalar / "Uygulama adı" / Durdurmaya zorla.',
        isLastStep: false,
      },
      {
        id: "thomson11-2",
        content:
          'Önbelleği silin: Önbelleğinizi silin. Bu seçeneği şurada bulabilirsiniz: Ayarlar / Uygulamalar / "Uygulama adı" / Önbelleği temizle.',
        isLastStep: false,
      },
      {
        id: "thomson11-3",
        content: 'Çalışmayan uygulamayı kaldırın. Şuraya gidin: Ayarlar / Uygulamalar / "Uygulama adı" / Kaldır.',
        isLastStep: false,
      },
      {
        id: "thomson11-4",
        content: "Kaldırdıktan sonra, uygulamayı Google Play Store'dan yeniden yükleyin.",
        isLastStep: true,
      },
    ],
    relatedProblems: ["thomson6", "thomson23"],
  },
  {
    id: "thomson12",
    question: "Cep telefonuma yüklediğim bazı uygulamalar Google Play Store'da bulunamıyor. Neden böyle oldu?",
    category: "thomson",
    solutionSteps: [
      {
        id: "thomson12-1",
        content:
          "TV seti Android TV ile çalıştırılır. Akıllı telefonlar için Google Play Store, Android TV'ler için olanla aynı değildir. Bazı uygulamalar yalnızca akıllı telefonlar için Google Play Store'da mevcuttur.",
        isLastStep: true,
      },
    ],
    relatedProblems: ["thomson24", "thomson20"],
  },
  {
    id: "thomson13",
    question: "Thomson TV'm hangi USB formatlarını destekliyor?",
    category: "thomson",
    solutionSteps: [
      {
        id: "thomson13-1",
        content: "Thomson Smart TV'ler FAT32 ve NTFS formatlarını destekler. ExFAT desteklenmez.",
        isLastStep: true,
      },
    ],
    relatedProblems: ["thomson3", "thomson4"],
  },
  {
    id: "thomson14",
    question: "Wi-Fi bağlantım sürekli kopuyor. Ne yapabilirim?",
    category: "thomson",
    solutionSteps: [
      {
        id: "thomson14-1",
        content:
          "Bu hata Wi-Fi sinyalinin zayıf olduğunu gösteriyor olabilir. Cihazın yönlendiriciden çok uzakta olmadığından emin olun.",
        isLastStep: false,
      },
      {
        id: "thomson14-2",
        content:
          "Yönlendiriciyi yeniden başlatın ve Thomson cihazınızı elektrik fişinden çekerek sıfırlayın. Gücü tekrar takmadan önce 1 dakika bekleyin.",
        isLastStep: false,
      },
      {
        id: "thomson14-3",
        content:
          "Ayarlar menüsünden Wi-Fi bağlantısını kesip yeniden bağlayın: Ayarlar > Ağ > Ağınızı seçin > Ağı unut",
        isLastStep: true,
      },
    ],
    relatedProblems: ["thomson2", "thomson16"],
  },
  {
    id: "thomson15",
    question: "Televizyonuma kaydettiğim TV programlarını nasıl oynatabilirim?",
    category: "thomson",
    solutionSteps: [
      {
        id: "thomson15-1",
        content: "Lütfen Canlı TV uygulamasını açın.",
        isLastStep: false,
      },
      {
        id: "thomson15-2",
        content: "Menü düğmesine basın, Kayıt listesine gidin ve Kaydedilen programı seçin.",
        isLastStep: false,
      },
      {
        id: "thomson15-3",
        content: "Oynatmayı başlatmak için OK düğmesine basın.",
        isLastStep: true,
      },
    ],
    relatedProblems: ["thomson3"],
  },
  {
    id: "thomson16",
    question: "Google Asistan çalışmıyor. Ne yapabilirim?",
    category: "thomson",
    solutionSteps: [
      {
        id: "thomson16-1",
        content: "Uzaktan kumandanız Thomson Smart TV ile eşleştirilmemiş olabilir.",
        isLastStep: false,
      },
      {
        id: "thomson16-2",
        content:
          "Uzaktan kumandanın TV ile eşleştirilip eşleştirilmediğini kontrol etmek için Ayarlar / Uzaktan kumandalar ve aksesuarlar menüsüne gidin.",
        isLastStep: true,
      },
    ],
    relatedProblems: ["thomson5", "thomson17"],
  },
  {
    id: "thomson17",
    question: "Bluetooth uzaktan kumandayı Smart TV ile nasıl eşleştirebilirim?",
    category: "thomson",
    solutionSteps: [
      {
        id: "thomson17-1",
        content: "Ayarlar / Uzaktan kumanda ve aksesuarlar / Aksesuar ekle menüsünü açın ve OK düğmesine basın.",
        isLastStep: false,
      },
      {
        id: "thomson17-2",
        content:
          "Ardından, kırmızı LED yanıp sönmeye başlayana kadar uzaktan kumandanızdaki Ses Azaltma (-) düğmesine ve Geri (<) düğmesine aynı anda basın.",
        isLastStep: false,
      },
      {
        id: "thomson17-3",
        content:
          "TV ekranınızın üst kısmında görüntülenen listeden THOMSON RCU'yu seçin ve eşleştirme işlemini başlatmak için OK düğmesine basın.",
        isLastStep: false,
      },
      {
        id: "thomson17-4",
        content:
          "Eşleştirme işlemi tamamlandığında ve uzaktan kumandanız TV ile başarıyla eşleştirildiğinde, bu menüden çıkmak için Çıkış düğmesine basın.",
        isLastStep: true,
      },
    ],
    relatedProblems: ["thomson16", "thomson18"],
  },
  {
    id: "thomson18",
    question: "Bluetooth cihazlarını Thomson Smart TV'me nasıl bağlayabilirim?",
    category: "thomson",
    solutionSteps: [
      {
        id: "thomson18-1",
        content: "Ayarlar / Uzaktan kumandalar ve aksesuarlar / Aksesuar ekle menüsüne gidin / OK tuşuna basın.",
        isLastStep: false,
      },
      {
        id: "thomson18-2",
        content: "Bluetooth araması başlayacak ve TV ekranınızda mevcut cihazların bir listesi görüntülenecektir.",
        isLastStep: false,
      },
      {
        id: "thomson18-3",
        content:
          'Not: Bağlamak istediğiniz cihazın "Eşleştirme" veya "Keşif" moduna ayarlı olduğundan emin olun. Cihazı "Eşleştirme" moduna nasıl ayarlayacağınızı öğrenmek için lütfen Bluetooth cihazının kullanım kılavuzuna bakın.',
        isLastStep: true,
      },
    ],
    relatedProblems: ["thomson17", "thomson19"],
  },
  {
    id: "thomson19",
    question: "Thomson Smart TV'me hangi Bluetooth cihazlarını bağlayabilirim?",
    category: "thomson",
    solutionSteps: [
      {
        id: "thomson19-1",
        content:
          "Kulaklık ve hoparlör gibi ses cihazlarının yanı sıra klavye veya oyun kumandası gibi giriş cihazlarını Bluetooth aracılığıyla Thomson Smart TV'ye bağlayabilirsiniz.",
        isLastStep: false,
      },
      {
        id: "thomson19-2",
        content: "Aynı anda bağlanan çok sayıda cihazın birbirlerinin işlevselliğini bozabileceğini lütfen unutmayın.",
        isLastStep: true,
      },
    ],
    relatedProblems: ["thomson18", "thomson17"],
  },
  {
    id: "thomson20",
    question: "Android'li Thomson Smart TV'm ile neler yapabilirim?",
    category: "thomson",
    solutionSteps: [
      {
        id: "thomson20-1",
        content:
          "Binlerce film ve TV şovunu izleyebilir, oyun oynayabilir, müzik dinleyebilir ve Google Play Store'dan 7000'den fazla uygulamaya erişebilirsiniz.",
        isLastStep: false,
      },
      {
        id: "thomson20-2",
        content: "Ayrıca geleneksel bir kablo, karasal yayın veya uydu anteni aracılığıyla canlı TV izleyebilirsiniz.",
        isLastStep: false,
      },
      {
        id: "thomson20-3",
        content:
          "Smart TV'nizin özelliklerine ayrıntılı bir genel bakış için lütfen resmi Thomson web sitesini ziyaret edin.",
        isLastStep: true,
      },
    ],
    relatedProblems: ["thomson9", "thomson24"],
  },
  {
    id: "thomson21",
    question: "Uzaktan kumandamda arka ışığı nasıl açıp kapatabilirim?",
    category: "thomson",
    solutionSteps: [
      {
        id: "thomson21-1",
        content: "OK düğmesine 5 saniye boyunca basarak arka ışığı açıp kapatabilirsiniz.",
        isLastStep: true,
      },
    ],
    relatedProblems: ["thomson17", "thomson16"],
  },
  {
    id: "thomson22",
    question: "Thomson Smart TV'mde hangi tunerler var?",
    category: "thomson",
    solutionSteps: [
      {
        id: "thomson22-1",
        content: "Thomson Smart TV'ler aşağıdaki tunerlere sahiptir: DVB-T2/S2/C.",
        isLastStep: true,
      },
    ],
    relatedProblems: ["thomson2"],
  },
  {
    id: "thomson23",
    question: "Uygulamaları nasıl yükleyebilirim?",
    category: "thomson",
    solutionSteps: [
      {
        id: "thomson23-1",
        content: "Google Play'den uygulama indirmek için bir Google Hesabı ile oturum açmış olmanız gerekir.",
        isLastStep: false,
      },
      {
        id: "thomson23-2",
        content:
          "İlk kurulum sırasında bir Google Hesabı girmediyseniz, Thomson Smart TV'nizin ana ekranında Google Play Store uygulamasını ilk kez açtığınızda Google Hesabı oturum açma işlemine yönlendirileceksiniz.",
        isLastStep: false,
      },
      {
        id: "thomson23-3",
        content:
          "Thomson Smart TV'nizin ana ekranında Google Play Store uygulamasını açın, uygulamaları arayın ve istediğiniz uygulamaları indirin.",
        isLastStep: true,
      },
    ],
    relatedProblems: ["thomson12", "thomson11"],
  },
  {
    id: "thomson24",
    question: "Thomson Smart TV'de önceden yüklenmiş uygulamalar var mı?",
    category: "thomson",
    solutionSteps: [
      {
        id: "thomson24-1",
        content:
          "Önceden yüklenmiş uygulamalar arasında Netflix, YouTube, Google Play, Google Movie, Google Music, Google Game ve daha fazlası yer alıyor.",
        isLastStep: true,
      },
    ],
    relatedProblems: ["thomson20", "thomson23"],
  },
  // Mevcut veritabanı sorunlarını korumak için burada tutuyorum
  {
    id: "p1",
    question: "Cihazım açılmıyor",
    category: "technical",
    solutionSteps: [
      {
        id: "s1-1",
        content: "Cihazınızın güç kablosunun prize takılı olduğundan emin olun.",
        isLastStep: false,
      },
      {
        id: "s1-2",
        content: "Güç düğmesine basın ve 10 saniye bekleyin.",
        isLastStep: false,
      },
      {
        id: "s1-3",
        content: "Farklı bir prize takmayı deneyin.",
        isLastStep: false,
      },
      {
        id: "s1-4",
        content: "Cihazı kapatıp, fişini çekin. 1 dakika bekledikten sonra tekrar prize takıp açmayı deneyin.",
        isLastStep: true,
      },
    ],
    relatedProblems: ["p2", "p3"],
  },
  {
    id: "p2",
    question: "Cihazım ara sıra kapanıyor",
    category: "technical",
    solutionSteps: [
      {
        id: "s2-1",
        content: "Cihazınızın havalandırma kanallarının toz veya engel olmadan açık olduğundan emin olun.",
        isLastStep: false,
      },
      {
        id: "s2-2",
        content:
          "Cihazınızın aşırı ısınıp ısınmadığını kontrol edin. Sıcaksa, soğuması için kapatın ve bir süre bekleyin.",
        isLastStep: false,
      },
      {
        id: "s2-3",
        content: "Yazılım güncellemelerini kontrol edin ve varsa güncellemeleri yükleyin.",
        isLastStep: true,
      },
    ],
    relatedProblems: ["p1", "p4"],
  },
  {
    id: "p3",
    question: "Cihazım ses çıkarmıyor",
    category: "technical",
    solutionSteps: [
      {
        id: "s3-1",
        content: "Ses seviyesinin açık ve yeterince yüksek olduğundan emin olun.",
        isLastStep: false,
      },
      {
        id: "s3-2",
        content: "Hoparlör veya kulaklık bağlantılarını kontrol edin.",
        isLastStep: false,
      },
      {
        id: "s3-3",
        content: "Cihazı yeniden başlatın ve ses ayarlarını kontrol edin.",
        isLastStep: false,
      },
      {
        id: "s3-4",
        content: "Farklı bir ses kaynağı (video, müzik) ile test edin.",
        isLastStep: true,
      },
    ],
  },
  {
    id: "p4",
    question: "Cihazım çok yavaş çalışıyor",
    category: "technical",
    solutionSteps: [
      {
        id: "s4-1",
        content: "Cihazınızı yeniden başlatın.",
        isLastStep: false,
      },
      {
        id: "s4-2",
        content: "Arka planda çalışan uygulamaları kapatın.",
        isLastStep: false,
      },
      {
        id: "s4-3",
        content: "Depolama alanınızı kontrol edin, gerekirse eski ve kullanılmayan dosyaları temizleyin.",
        isLastStep: false,
      },
      {
        id: "s4-4",
        content: "Yazılım güncellemelerini kontrol edin ve varsa güncellemeleri yükleyin.",
        isLastStep: true,
      },
    ],
    relatedProblems: ["p2"],
  },
  {
    id: "p5",
    question: "Faturamı göremiyorum",
    category: "payment",
    solutionSteps: [
      {
        id: "s5-1",
        content: "Hesabınıza giriş yaptığınızdan emin olun.",
        isLastStep: false,
      },
      {
        id: "s5-2",
        content: "'Faturalarım' veya 'Siparişlerim' bölümüne gidin.",
        isLastStep: false,
      },
      {
        id: "s5-3",
        content: "İlgili tarihi seçerek faturanızı arayın.",
        isLastStep: false,
      },
      {
        id: "s5-4",
        content: "Tarayıcınızın önbelleğini temizleyin ve tekrar deneyin.",
        isLastStep: true,
      },
    ],
  },
  {
    id: "p6",
    question: "Şifremi unuttum",
    category: "account",
    solutionSteps: [
      {
        id: "s6-1",
        content: "Giriş sayfasındaki 'Şifremi Unuttum' bağlantısına tıklayın.",
        isLastStep: false,
      },
      {
        id: "s6-2",
        content: "Kayıtlı e-posta adresinizi girin.",
        isLastStep: false,
      },
      {
        id: "s6-3",
        content: "E-postanıza gelen şifre sıfırlama bağlantısına tıklayın.",
        isLastStep: false,
      },
      {
        id: "s6-4",
        content: "Yeni bir şifre belirleyin ve kaydedin.",
        isLastStep: true,
      },
    ],
  },
  {
    id: "p7",
    question: "Garanti sürem ne zaman bitiyor?",
    category: "products",
    solutionSteps: [
      {
        id: "s7-1",
        content: "Hesabınıza giriş yapın ve 'Ürünlerim' bölümüne gidin.",
        isLastStep: false,
      },
      {
        id: "s7-2",
        content: "İlgili ürünü seçin ve detaylarını görüntüleyin.",
        isLastStep: false,
      },
      {
        id: "s7-3",
        content: "Garanti bilgileri ürün detaylarında listelenmektedir.",
        isLastStep: false,
      },
      {
        id: "s7-4",
        content: "Garanti belgenizi veya satın alma faturanızı kontrol edin.",
        isLastStep: true,
      },
    ],
  },
  {
    id: "p8",
    question: "Ödeme yaparken hata alıyorum",
    category: "payment",
    solutionSteps: [
      {
        id: "s8-1",
        content: "Kart bilgilerinizin doğru girildiğinden emin olun.",
        isLastStep: false,
      },
      {
        id: "s8-2",
        content: "Kartınızın internet alışverişine açık olduğundan emin olun.",
        isLastStep: false,
      },
      {
        id: "s8-3",
        content: "Farklı bir tarayıcı veya cihaz kullanmayı deneyin.",
        isLastStep: false,
      },
      {
        id: "s8-4",
        content: "Bankanızla iletişime geçerek kartınızın durumunu kontrol edin.",
        isLastStep: true,
      },
    ],
  },
]

// Update the faqCategories with more realistic data based on the example site
const faqCategories = [
  {
    id: "thomson",
    title: "Thomson Smart TV",
    icon: <CreditCard className="h-6 w-6" />,
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=2070&auto=format&fit=crop",
    faqs: [
      {
        id: 101,
        question: "Thomson Smart TV'mdeki girişleri nasıl değiştirebilirim?",
        answer:
          "Uzaktan kumanda üzerindeki SOURCE (KAYNAK) düğmesine basın ve yukarı/aşağı düğmelerini kullanarak istediğiniz girişe geçin.",
      },
      {
        id: 102,
        question: "Thomson Smart TV'yi çalıştırmak için hangi bağlantılara ihtiyacım var?",
        answer:
          "Canlı TV programlarını izlemek için Thomson Smart TV'nizin bir uydu veya karasal antene ya da bir kablo ağına bağlı olması gerekir. Tam Smart TV deneyiminin keyfini çıkarmak istiyorsanız, Thomson Smart TV'nizi bir Wi-Fi veya LAN kablosu aracılığıyla İnternet'e bağlamanız gerekir.",
      },
      {
        id: 103,
        question: "Thomson Smart TV'mde bir USB sürücüdeki medya dosyalarını nasıl oynatabilirim?",
        answer:
          "Thomson Smart TV'nin USB bağlantı noktasına harici bir USB sürücü bağlayın. Önceden yüklenmiş multimedya oynatıcı uygulaması MMP'yi açın ve oynatmak istediğiniz dosyayı seçin. Oynatmayı başlatmak için OK düğmesine basın.",
      },
    ],
  },
  {
    id: "account",
    title: "Hesap İşlemleri",
    icon: <User className="h-6 w-6" />,
    image: "https://images.unsplash.com/photo-1556155092-490a1ba16284?q=80&w=2070&auto=format&fit=crop",
    faqs: [
      {
        id: 1,
        question: "Şifremi unuttum, ne yapmalıyım?",
        answer:
          "Giriş sayfasında 'Şifremi Unuttum' seçeneğine tıklayarak e-posta adresinize sıfırlama bağlantısı gönderebilirsiniz.",
      },
      {
        id: 2,
        question: "Hesap bilgilerimi nasıl güncelleyebilirim?",
        answer: "Hesabınıza giriş yaptıktan sonra 'Profil' bölümünden kişisel bilgilerinizi güncelleyebilirsiniz.",
      },
      {
        id: 3,
        question: "E-posta adresimi değiştirmek istiyorum",
        answer:
          "Hesap ayarları sayfasından e-posta adresinizi güncelleyebilir ve yeni adresinize gönderilen doğrulama bağlantısını onaylayabilirsiniz.",
      },
    ],
  },
  {
    id: "products",
    title: "Ürün ve Servis",
    icon: <Settings className="h-6 w-6" />,
    image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=2070&auto=format&fit=crop",
    faqs: [
      {
        id: 4,
        question: "Ürünümün garanti süresi doldu, ne yapabilirim?",
        answer:
          "Garanti süresi dolan ürünler için ücretli servis hizmetimizden yararlanabilirsiniz. Servis talebi oluşturarak size en yakın yetkili servisi yönlendirebiliriz.",
      },
      {
        id: 5,
        question: "Ürünümün parçalarını nereden temin edebilirim?",
        answer:
          "Yedek parça ihtiyaçlarınız için yetkili servislerimizle iletişime geçebilir veya online mağazamızdan sipariş verebilirsiniz.",
      },
      {
        id: 6,
        question: "Servis randevumu nasıl iptal edebilirim?",
        answer:
          "Servis randevunuzu iptal etmek için hesabınıza giriş yaparak 'Servis Taleplerim' bölümünden ilgili talebi seçip iptal işlemini gerçekleştirebilirsiniz.",
      },
    ],
  },
  {
    id: "technical",
    title: "Teknik Destek",
    icon: <HelpCircle className="h-6 w-6" />,
    image: "https://images.unsplash.com/photo-1581092335397-9583eb92d232?q=80&w=2070&auto=format&fit=crop",
    faqs: [
      {
        id: 7,
        question: "Ürünüm çalışmıyor, ne yapmalıyım?",
        answer:
          "Öncelikle ürünün fişinin takılı olduğundan ve açma/kapama düğmesinin açık konumda olduğundan emin olun. Sorun devam ederse, kullanım kılavuzundaki sorun giderme bölümünü kontrol edin veya teknik destek hattımızı arayın.",
      },
      {
        id: 8,
        question: "Ürünümden garip sesler geliyor",
        answer:
          "Ürününüzün düz bir zeminde olduğundan ve tüm parçaların doğru şekilde monte edildiğinden emin olun. Sorun devam ederse, servis talebinde bulunarak teknik destek alabilirsiniz.",
      },
      {
        id: 9,
        question: "Ürünümün yazılımını nasıl güncelleyebilirim?",
        answer:
          "Ürününüzün modeline göre yazılım güncelleme talimatları değişiklik gösterebilir. Kullanım kılavuzunuzdaki yazılım güncelleme bölümünü inceleyebilir veya web sitemizin destek bölümünden model numaranızı girerek güncel yazılımı indirebilirsiniz.",
      },
    ],
  },
  {
    id: "payment",
    title: "Ödeme ve Fatura",
    icon: <CreditCard className="h-6 w-6" />,
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=2070&auto=format&fit=crop",
    faqs: [
      {
        id: 10,
        question: "Faturamı nasıl görüntüleyebilirim?",
        answer:
          "Hesabınıza giriş yaptıktan sonra 'Siparişlerim' veya 'Faturalarım' bölümünden geçmiş faturalarınızı görüntüleyebilir ve indirebilirsiniz.",
      },
      {
        id: 11,
        question: "Hangi ödeme yöntemlerini kabul ediyorsunuz?",
        answer:
          "Kredi kartı, banka kartı, havale/EFT ve kapıda ödeme seçeneklerimiz mevcuttur. Ayrıca taksitli ödeme imkanlarımız hakkında bilgi almak için müşteri hizmetlerimizle iletişime geçebilirsiniz.",
      },
      {
        id: 12,
        question: "Ödeme yaparken hata alıyorum",
        answer:
          "Kart bilgilerinizin doğru girildiğinden ve kartınızın online alışverişe açık olduğundan emin olun. Sorun devam ederse, bankanızla iletişime geçerek kartınızın durumunu kontrol etmenizi öneririz.",
      },
    ],
  },
]

// Update the popularSearches with a more logical order
const popularSearches = [
  "Garanti sorgulama",
  "Garanti süresini uzat",
  "Servis randevusu",
  "Arıza bildirimi",
  "Fatura görüntüleme",
  "Şifre sıfırlama",
]

function NavItem({
  href,
  icon,
  children,
  active,
}: { href: string; icon: React.ReactNode; children: React.ReactNode; active?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200",
        active ? "bg-primary bg-opacity-10 text-primary" : "text-text hover:bg-gray-50",
      )}
    >
      {icon}
      <span>{children}</span>
    </Link>
  )
}

function FAQItem({
  question,
  answer,
  isOpen,
  onClick,
}: { question: string; answer: string; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        className="flex justify-between items-center w-full py-5 text-left font-primary font-primaryBold text-gray-800 hover:text-primary transition-colors duration-200 group"
        onClick={onClick}
      >
        <span className="group-hover:translate-x-1 transition-transform duration-300">{question}</span>
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 group-hover:bg-primary/10 transition-all duration-300 ${isOpen ? "bg-primary/10" : ""}`}
        >
          <ChevronDown
            className={`h-4 w-4 text-gray-500 group-hover:text-primary transition-transform duration-300 ${isOpen ? "rotate-180 text-primary" : ""}`}
          />
        </div>
      </button>
      {isOpen && <div className="py-5 text-gray-600 font-text animate-slideDown max-w-3xl">{answer}</div>}
    </div>
  )
}

// Chatbot bileşeni
function Chatbot({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Merhaba! Size nasıl yardımcı olabilirim?" },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Mesajları en alta kaydır
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // AI ile mesaj gönderme
  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage = input.trim()
    setInput("")

    // Kullanıcı mesajını ekle
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setIsLoading(true)

    try {
      // Check if we're in a development environment without API keys
      const hasOpenAIKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY

      if (!hasOpenAIKey) {
        // Fallback response when API key is missing
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content:
                "Merhaba! Bu bir demo sürümüdür. Gerçek API anahtarı olmadığı için şu anda yapay zeka yanıtları sağlayamıyorum. Lütfen teknik destek ekibimizle iletişime geçin veya SSS bölümünü kontrol edin.",
            },
          ])
          setIsLoading(false)
        }, 1000)
        return
      }

      // If we have an API key, proceed with the normal flow
      const prompt =
        messages.map((msg) => `${msg.role === "user" ? "Kullanıcı" : "Asistan"}: ${msg.content}`).join("\n") +
        `\nKullanıcı: ${userMessage}\nAsistan:`

      // AI'dan yanıt al
      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt: prompt,
        system:
          "Sen A-Garanti'nin yapay zeka destekli yardımcısısın. Kullanıcılara elektronik ürünler, garanti süreçleri ve teknik sorunlar hakkında yardımcı oluyorsun. Yanıtların kısa, net ve yardımcı olmalı. Thomson Smart TV, garanti işlemleri, teknik destek ve ödeme konularında bilgilisin.",
      })

      // AI yanıtını ekle
      setMessages((prev) => [...prev, { role: "assistant", content: text }])
    } catch (error) {
      console.error("AI yanıt hatası:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Üzgünüm, bir hata oluştu. Lütfen daha sonra tekrar deneyin veya teknik destek ekibimizle iletişime geçin.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed bottom-20 right-6 w-80 md:w-96 h-[500px] bg-white rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-primary text-white p-4 flex justify-between items-center">
        <div className="flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          <h3 className="font-primary font-bold">A-Garanti Asistan</h3>
        </div>
        <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.map((message, index) => (
          <div key={index} className={`mb-4 ${message.role === "user" ? "flex justify-end" : "flex justify-start"}`}>
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === "user"
                  ? "bg-primary text-white rounded-tr-none"
                  : "bg-white text-gray-800 border border-gray-200 rounded-tl-none"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="max-w-[80%] p-3 rounded-lg bg-white text-gray-800 border border-gray-200 rounded-tl-none">
              <div className="flex space-x-2">
                <div
                  className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <div className="flex">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Mesajınızı yazın..."
            className="flex-1 focus-visible:ring-primary"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="ml-2 bg-primary hover:bg-primary/90 text-white"
            size="icon"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function SelfServicePortal() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Problem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [openFaqId, setOpenFaqId] = useState<string | number | null>(null)
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)

  // Sorun giderme akışı için state'ler
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [solutionHistory, setSolutionHistory] = useState<string[]>([])
  const [showCreateServiceRequest, setShowCreateServiceRequest] = useState(false)

  // Arama önerilerini göstermek için fonksiyon
  const getSearchSuggestions = (query: string) => {
    if (!query.trim()) return []

    const lowercasedQuery = query.toLowerCase()

    return problemsDatabase
      .filter((problem) => problem.question.toLowerCase().includes(lowercasedQuery))
      .slice(0, 5) // Maks 5 öneri göster
      .map((problem) => ({
        id: problem.id,
        question: problem.question,
      }))
  }

  // Self-service portal bileşeninin içindeki state bölümüne eklemeler
  const [searchSuggestions, setSearchSuggestions] = useState<{ id: string; question: string }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // handleSearch fonksiyonundan hemen önce, arama önerilerini yönetmek için yeni bir fonksiyon ekle

  // Arama kutusundaki değişiklikleri ele al
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)

    // Arama önerilerini güncelle
    const suggestions = getSearchSuggestions(value)
    setSearchSuggestions(suggestions)
    setShowSuggestions(suggestions.length > 0)
  }

  // Bir öneriyi seçme işlemini ele al
  const handleSuggestionSelect = (id: string, question: string) => {
    setSearchQuery(question)
    setShowSuggestions(false)

    // İlgili problemi bul
    const problem = problemsDatabase.find((p) => p.id === id)
    if (problem) {
      setSearchResults([problem])
    }
  }

  // Handle search
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    // Sorun veritabanında arama yap
    const results = problemsDatabase.filter((problem) =>
      problem.question.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    setSearchResults(results)
    setSelectedProblem(null)
    setCurrentStepIndex(0)
    setSolutionHistory([])
    setShowCreateServiceRequest(false)
  }

  // Sorun seçildiğinde
  const handleSelectProblem = (problem: Problem) => {
    setSelectedProblem(problem)
    setCurrentStepIndex(0)
    setSolutionHistory([])
    setShowCreateServiceRequest(false)
  }

  // Çözüm adımı için "Tamamlandı" butonuna tıklandığında
  const handleSolutionCompleted = () => {
    // Sorun çözüldü, teşekkür mesajı göster
    setSelectedProblem(null)
    setSearchResults([])
    setSearchQuery("")
  }

  // Çözüm adımı için "Başka çözüm dene" butonuna tıklandığında
  const handleTryNextSolution = () => {
    if (!selectedProblem) return

    // Mevcut adımı geçmişe ekle
    setSolutionHistory([...solutionHistory, selectedProblem.solutionSteps[currentStepIndex].id])

    // Sonraki adıma geç
    const nextIndex = currentStepIndex + 1

    // Eğer bu son adımsa ve çözüm bulunamadıysa servis talebi oluştur butonunu göster
    if (nextIndex >= selectedProblem.solutionSteps.length) {
      setShowCreateServiceRequest(true)
    } else {
      setCurrentStepIndex(nextIndex)
    }
  }

  // İlgili başka bir soruna geçiş
  const handleRelatedProblem = (problemId: string) => {
    const problem = problemsDatabase.find((p) => p.id === problemId)
    if (problem) {
      setSelectedProblem(problem)
      setCurrentStepIndex(0)
      setSolutionHistory([])
      setShowCreateServiceRequest(false)
    }
  }

  // Toggle FAQ item
  const toggleFaq = (id: string | number | null) => {
    setOpenFaqId(openFaqId === id ? null : id)
  }

  const [currentSlide, setCurrentSlide] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  // Carousel için maksimum slide sayısını hesapla
  const getMaxSlide = () => {
    if (typeof window !== "undefined") {
      if (window.innerWidth >= 1024) {
        // lg breakpoint - 4 items per view
        return Math.max(0, Math.ceil(faqCategories.length / 4) - 1)
      } else if (window.innerWidth >= 768) {
        // md breakpoint - 2 items per view
        return Math.max(0, Math.ceil(faqCategories.length / 2) - 1)
      }
    }
    // mobile - 1 item per view
    return faqCategories.length - 1
  }

  const [maxSlide, setMaxSlide] = useState(getMaxSlide())

  // Responsive olarak maksimum slide sayısını güncelle
  useEffect(() => {
    const handleResize = () => {
      setMaxSlide(getMaxSlide())
      // Eğer mevcut slide, yeni maksimum slide'dan büyükse, maksimum slide'a ayarla
      if (currentSlide > getMaxSlide()) {
        setCurrentSlide(getMaxSlide())
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [currentSlide])

  // Carousel navigasyon fonksiyonları
  const nextSlide = () => {
    if (currentSlide < maxSlide) {
      setCurrentSlide(currentSlide + 1)
    }
  }

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] font-text">
      {/* Header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white shadow-md" : "bg-gradient-to-r from-primary/90 to-primary/70 text-white"
        }`}
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div
                className={`p-2 rounded-lg ${scrolled ? "bg-primary/10" : "bg-white/20"} transition-all duration-300`}
              >
                <Logo />
              </div>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className={`md:hidden p-2 rounded-full ${
              scrolled ? "text-gray-800 hover:bg-gray-100" : "text-white hover:bg-white/10"
            } transition-colors`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="#"
              className={`font-primary transition-colors text-sm font-medium ${
                scrolled ? "text-gray-800 hover:text-primary" : "text-white/90 hover:text-white"
              }`}
            >
              Ana Sayfa
            </Link>
            <Link
              href="#"
              className={`font-primary transition-colors text-sm font-medium ${
                scrolled ? "text-gray-800 hover:text-primary" : "text-white/90 hover:text-white"
              }`}
            >
              Hakkımızda
            </Link>
            <Link
              href="#"
              className={`font-primary transition-colors text-sm font-medium ${
                scrolled ? "text-gray-800 hover:text-primary" : "text-white/90 hover:text-white"
              }`}
            >
              Hizmetler
            </Link>
            <Link
              href="#"
              className={`font-primary transition-colors text-sm font-medium ${
                scrolled ? "text-gray-800 hover:text-primary" : "text-white/90 hover:text-white"
              }`}
            >
              İletişim
            </Link>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className={`${
                scrolled ? "text-gray-800 hover:bg-gray-100" : "text-white hover:bg-white/10"
              } transition-colors rounded-full`}
            >
              <Phone className="h-5 w-5" />
            </Button>
            <Button
              className={`${
                scrolled ? "bg-primary hover:bg-primary/90 text-white" : "bg-white hover:bg-white/90 text-primary"
              } font-primary font-primaryBold rounded-full transition-all hover:shadow-lg px-6`}
            >
              Giriş Yap
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://www.agaranti.com.tr/wp-content/uploads/2023/03/AGaranti-Ile-Tanisin.png"
            alt="A-Garanti İle Tanışın"
            fill
            className="object-cover brightness-[0.4]"
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-primary font-bold mb-6 text-white leading-tight">
              Size Nasıl <span className="text-primary">Yardımcı</span> Olabiliriz?
            </h1>
            <p className="text-lg mb-12 text-white/90 max-w-2xl mx-auto">
              Sorununuz için arama yapın, çözüm bulamazsanız servis talebi oluşturun.
            </p>

            <div className="relative max-w-2xl mx-auto">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="search"
                  placeholder="Sorunuzu yazın..."
                  className="pl-12 py-7 text-gray-800 font-text rounded-full shadow-xl border-0 focus:ring-2 focus:ring-primary"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  onFocus={() => searchQuery && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                <Button
                  className="absolute right-1.5 top-1.5 bg-primary hover:bg-primary/90 text-white rounded-full transition-all hover:shadow-md px-6 py-5"
                  onClick={handleSearch}
                >
                  Ara
                </Button>

                {/* Arama Önerileri Dropdown */}
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-lg z-50 overflow-hidden">
                    <ul className="py-2">
                      {searchSuggestions.map((suggestion) => (
                        <li
                          key={suggestion.id}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleSuggestionSelect(suggestion.id, suggestion.question)}
                        >
                          <div className="flex items-center">
                            <Search className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                            <span className="text-gray-800 text-sm line-clamp-1">{suggestion.question}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Popular searches */}
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {popularSearches.map((search, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 font-text rounded-full transition-all"
                    onClick={() => {
                      setSearchQuery(search)
                      handleSearch()
                    }}
                  >
                    {search}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-16 -mt-20 relative z-20">
        {/* Interactive Troubleshooting Flow */}
        {searchQuery !== "" && searchResults.length === 0 && solutionHistory.length === 0 && (
          <section className="mb-16 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
              <h2 className="text-2xl font-primary font-bold mb-8 text-gray-900 flex items-center">
                <Search className="mr-3 h-5 w-5 text-primary" />
                Arama Sonuçları
              </h2>

              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-primary font-bold mb-2">Sonuç Bulunamadı</h3>
                <p className="text-gray-600 mb-6">
                  "{searchQuery}" ile ilgili bir sonuç bulamadık. Lütfen farklı anahtar kelimelerle tekrar deneyin veya
                  servis talebi oluşturun.
                </p>
                <Button
                  onClick={() => setShowServiceForm(true)}
                  className="bg-accent hover:bg-accent/90 text-white font-primary font-primaryBold rounded-full transition-all hover:shadow-lg px-6 py-6"
                >
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Servis Talebi Oluştur
                </Button>
              </div>
            </div>
          </section>
        )}

        {searchResults.length > 0 && !selectedProblem && (
          <section className="mb-16 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
              <h2 className="text-2xl font-primary font-bold mb-8 text-gray-900 flex items-center">
                <Search className="mr-3 h-5 w-5 text-primary" />
                Arama Sonuçları
              </h2>

              <div className="space-y-4">
                {searchResults.map((problem) => (
                  <div key={problem.id} className="border-b border-gray-100 last:border-0">
                    <button
                      className="flex justify-between items-center w-full py-5 text-left font-primary font-primaryBold text-gray-800 hover:text-primary transition-colors duration-200 group"
                      onClick={() => handleSelectProblem(problem)}
                    >
                      <span className="group-hover:translate-x-1 transition-transform duration-300">
                        {problem.question}
                      </span>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 group-hover:bg-primary/10 transition-all duration-300">
                        <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-primary transition-transform duration-300" />
                      </div>
                    </button>
                  </div>
                ))}
              </div>

              {/* No solution found message */}
              <div className="mt-12 pt-6 border-t border-gray-100 text-center">
                <p className="text-gray-600 mb-4 font-text">Aradığınız sorunu bulamadınız mı?</p>
                <Button
                  onClick={() => setShowServiceForm(true)}
                  className="bg-accent hover:bg-accent/90 text-white font-primary font-primaryBold rounded-full transition-all hover:shadow-lg px-6 py-6"
                >
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Servis Talebi Oluştur
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Selected Problem Solution Steps */}
        {selectedProblem && (
          <section className="mb-16 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
              <div className="flex items-center gap-2 mb-8">
                <Button
                  variant="ghost"
                  className="p-0 hover:bg-transparent hover:text-primary transition-colors"
                  onClick={() => setSelectedProblem(null)}
                >
                  <ArrowRight className="h-4 w-4 mr-1 text-primary rotate-180" />
                  <span className="text-primary font-primary">Geri Dön</span>
                </Button>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <h2 className="text-2xl font-primary font-bold text-gray-900 flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3 text-primary">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  {selectedProblem.question}
                </h2>
              </div>

              {/* Solution Step */}
              <div className="bg-gray-50 rounded-xl p-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0 mt-1">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-primary font-bold text-lg mb-3">Çözüm Adımı {currentStepIndex + 1}</h3>
                    <p className="text-gray-700 mb-6">{selectedProblem.solutionSteps[currentStepIndex].content}</p>

                    <div className="flex flex-wrap gap-3">
                      <Button
                        className="bg-accent hover:bg-accent/90 text-white font-primary rounded-full transition-all hover:shadow-md"
                        onClick={handleSolutionCompleted}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Sorun Çözüldü
                      </Button>

                      {!selectedProblem.solutionSteps[currentStepIndex].isLastStep && (
                        <Button
                          variant="outline"
                          className="border-gray-300 text-gray-700 hover:bg-gray-100 font-primary rounded-full transition-all"
                          onClick={handleTryNextSolution}
                        >
                          <ArrowRightCircle className="mr-2 h-4 w-4" />
                          Sonraki Adıma Geç
                        </Button>
                      )}

                      {selectedProblem.solutionSteps[currentStepIndex].isLastStep && !showCreateServiceRequest && (
                        <Button
                          variant="outline"
                          className="border-gray-300 text-gray-700 hover:bg-gray-100 font-primary rounded-full transition-all"
                          onClick={handleTryNextSolution}
                        >
                          <ThumbsDown className="mr-2 h-4 w-4" />
                          Sorun Çözülmedi
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Request Button */}
              {showCreateServiceRequest && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-6 mb-8 animate-fadeIn">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500 flex-shrink-0 mt-1">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-primary font-bold text-lg mb-3">Sorun Çözülemedi</h3>
                      <p className="text-gray-700 mb-6">
                        Önerilen tüm çözüm adımlarını denemenize rağmen sorun devam ediyorsa, teknik destek ekibimizden
                        yardım alabilirsiniz.
                      </p>

                      <Button
                        className="bg-red-500 hover:bg-red-600 text-white font-primary rounded-full transition-all hover:shadow-md"
                        onClick={() => setShowServiceForm(true)}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Servis Talebi Oluştur
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Related Problems */}
              {selectedProblem.relatedProblems && selectedProblem.relatedProblems.length > 0 && (
                <div className="mt-12 pt-6 border-t border-gray-100">
                  <h3 className="font-primary font-bold text-lg mb-4">İlgili Sorunlar</h3>
                  <div className="space-y-2">
                    {selectedProblem.relatedProblems.map((problemId) => {
                      const problem = problemsDatabase.find((p) => p.id === problemId)
                      if (!problem) return null

                      return (
                        <button
                          key={problemId}
                          className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex justify-between items-center"
                          onClick={() => handleRelatedProblem(problemId)}
                        >
                          <span className="font-medium text-gray-800">{problem.question}</span>
                          <ArrowRight className="h-4 w-4 text-gray-500" />
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Categories Section */}
        {!selectedCategory && searchResults.length === 0 && !selectedProblem && (
          <section className="mb-16 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
              <h2 className="text-2xl md:text-3xl font-primary font-bold mb-12 text-gray-900 text-center">
                Yardım Kategorileri
              </h2>

              <div className="relative">
                {/* Carousel Container */}
                <div className="relative overflow-hidden">
                  <div
                    ref={carouselRef}
                    className="flex transition-transform duration-300 ease-in-out gap-4 py-4"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                  >
                    {faqCategories.map((category) => (
                      <div
                        key={category.id}
                        className="group cursor-pointer overflow-hidden rounded-2xl shadow-lg flex-shrink-0 w-full md:w-[calc(50%-8px)] lg:w-[calc(25%-12px)]"
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        <div className="relative h-48 overflow-hidden">
                          <Image
                            src={
                              category.id === "account"
                                ? "https://images.unsplash.com/photo-1556155092-490a1ba16284?q=80&w=2070&auto=format&fit=crop"
                                : category.id === "products"
                                  ? "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=2070&auto=format&fit=crop"
                                  : category.id === "technical"
                                    ? "https://images.unsplash.com/photo-1581092335397-9583eb92d232?q=80&w=2070&auto=format&fit=crop"
                                    : "https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=2070&auto=format&fit=crop"
                            }
                            alt={category.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                          <div className="absolute bottom-0 left-0 p-6">
                            <h3 className="font-primary font-bold text-white text-xl mb-1">{category.title}</h3>
                            <p className="text-white/80 text-sm">{category.faqs.length} soru</p>
                          </div>
                        </div>
                        <div className="bg-white p-4 flex justify-between items-center">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            {category.icon}
                          </div>
                          <span className="inline-flex items-center text-primary text-sm font-medium">
                            Görüntüle
                            <ArrowUpRight className="ml-1 h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <button
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors z-10 focus:outline-none"
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                  style={{ opacity: currentSlide === 0 ? 0.5 : 1 }}
                >
                  <ChevronRight className="h-6 w-6 rotate-180" />
                </button>

                <button
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors z-10 focus:outline-none"
                  onClick={nextSlide}
                  disabled={currentSlide >= maxSlide}
                  style={{ opacity: currentSlide >= maxSlide ? 0.5 : 1 }}
                >
                  <ChevronRight className="h-6 w-6" />
                </button>

                {/* Dots Indicator */}
                <div className="flex justify-center mt-6 gap-2">
                  {Array.from({ length: maxSlide + 1 }).map((_, index) => (
                    <button
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all ${
                        currentSlide === index ? "bg-primary w-6" : "bg-gray-300"
                      }`}
                      onClick={() => setCurrentSlide(index)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Selected Category FAQs */}
        {selectedCategory && (
          <section className="mb-16 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
              <div className="flex items-center gap-2 mb-8">
                <Button
                  variant="ghost"
                  className="p-0 hover:bg-transparent hover:text-primary transition-colors"
                  onClick={() => setSelectedCategory(null)}
                >
                  <Home className="h-4 w-4 mr-1 text-primary" />
                  <span className="text-primary font-primary">Kategoriler</span>
                </Button>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <h2 className="text-2xl font-primary font-bold text-gray-900 flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3 text-primary">
                    {faqCategories.find((c) => c.id === selectedCategory)?.icon}
                  </div>
                  {faqCategories.find((c) => c.id === selectedCategory)?.title}
                </h2>
              </div>

              <div className="space-y-4">
                {faqCategories
                  .find((c) => c.id === selectedCategory)
                  ?.faqs.map((faq) => (
                    <FAQItem
                      key={faq.id}
                      question={faq.question}
                      answer={faq.answer}
                      isOpen={openFaqId === faq.id}
                      onClick={() => toggleFaq(faq.id)}
                    />
                  ))}
              </div>

              {/* No solution found message */}
              <div className="mt-12 pt-6 border-t border-gray-100 text-center">
                <p className="text-gray-600 mb-4 font-text">Aradığınız çözümü bulamadınız mı?</p>
                <Button
                  onClick={() => setShowServiceForm(true)}
                  className="bg-accent hover:bg-accent/90 text-white font-primary font-primaryBold rounded-full transition-all hover:shadow-lg px-6 py-6"
                >
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Servis Talebi Oluştur
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Uzatılmış Garanti Bölümü */}
        {!selectedCategory && searchResults.length === 0 && !selectedProblem && (
          <section className="mb-16 animate-fadeIn">
            <div className="bg-white rounded-3xl overflow-hidden shadow-xl">
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-1/2 p-8 md:p-12">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium mb-6">
                    <Shield className="mr-2 h-4 w-4" /> Uzatılmış Garanti
                  </div>
                  <h2 className="text-2xl md:text-3xl font-primary font-bold text-gray-900 mb-4">
                    Ürünleriniz için Uzatılmış Garanti
                  </h2>
                  <p className="text-gray-600 mb-8">
                    A-Garanti ile ürünlerinizin standart garanti süresi dolduktan sonra bile güvende olun. Uzatılmış
                    garanti paketlerimizle beklenmedik tamir masraflarından korunun.
                  </p>
                  <Button className="bg-accent hover:bg-accent/90 text-white font-primary font-primaryBold rounded-full transition-all hover:shadow-lg px-6 py-6 group">
                    <Shield className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                    Garanti Paketlerini İncele
                  </Button>
                </div>
                <div className="md:w-1/2">
                  <div className="relative h-full">
                    <Image
                      src="https://www.agaranti.com.tr/wp-content/uploads/2023/03/AGaranti-ile-Kendinizi-Garanti-Altina-Alin.png"
                      alt="A-Garanti ile Kendinizi Garanti Altına Alın"
                      width={600}
                      height={400}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent md:bg-gradient-to-r md:from-white/80 md:to-transparent"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Popular FAQs */}
        {!selectedCategory && searchResults.length === 0 && !selectedProblem && (
          <section className="animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
              <h2 className="text-2xl md:text-3xl font-primary font-bold mb-8 text-gray-900 text-center">
                Sıkça Sorulan Sorular
              </h2>

              <div className="space-y-4">
                {faqCategories.map((category) => (
                  <div key={category.id} className="border border-gray-100 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleFaq(category.id === openFaqId ? null : category.id)}
                      className="flex justify-between items-center w-full p-4 text-left font-primary font-primaryBold text-gray-800 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          {category.icon}
                        </div>
                        <span>{category.title}</span>
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                          category.id === openFaqId ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {category.id === openFaqId && (
                      <div className="px-4 pb-4 animate-slideDown">
                        <div className="pt-2 border-t border-gray-100">
                          <ul className="space-y-3 mt-3">
                            {category.faqs.map((faq) => (
                              <li key={faq.id} className="text-gray-600 hover:text-primary transition-colors">
                                <button
                                  onClick={() => {
                                    setSelectedCategory(category.id)
                                    setOpenFaqId(faq.id)
                                  }}
                                  className="text-left flex items-center gap-2 w-full"
                                >
                                  <ArrowRight className="h-3 w-3 text-primary flex-shrink-0" />
                                  <span>{faq.question}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* View all FAQs button */}
              <div className="mt-8 text-center">
                <Button className="bg-primary hover:bg-primary/90 text-white font-primary font-primaryBold rounded-full transition-all hover:shadow-lg px-6 py-6 group">
                  Tüm SSS Görüntüle
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Chatbot Toggle Button */}
      <button
        onClick={() => setIsChatbotOpen(true)}
        className="fixed bottom-6 right-20 w-12 h-12 rounded-full bg-accent shadow-lg flex items-center justify-center text-white hover:bg-accent/90 transition-colors z-10 focus:outline-none"
      >
        <MessageSquare className="h-6 w-6" />
      </button>

      {/* Chatbot Component */}
      <Chatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />

      {/* Service Form Dialog */}
      <Dialog open={showServiceForm} onOpenChange={setShowServiceForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Servis Talebi Oluştur</DialogTitle>
            <DialogDescription>
              Lütfen sorununuzu detaylı bir şekilde açıklayın, size en kısa sürede yardımcı olacağız.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right font-medium">
                Ad Soyad
              </label>
              <Input id="name" value="" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="email" className="text-right font-medium">
                E-posta
              </label>
              <Input id="email" value="" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="category" className="text-right font-medium">
                Kategori
              </label>
              <Select>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Bir kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Teknik Destek</SelectItem>
                  <SelectItem value="payment">Ödeme ve Fatura</SelectItem>
                  <SelectItem value="account">Hesap İşlemleri</SelectItem>
                  <SelectItem value="products">Ürün ve Servis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="description" className="text-right font-medium">
                Açıklama
              </label>
              <Textarea id="description" className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Gönder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-primary/90 to-primary/70 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo ve Hakkında */}
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-lg bg-white/20 transition-all duration-300">
                  <Logo />
                </div>
              </div>
              <p className="text-white/80 text-sm mb-4">
                A-Garanti, elektronik ürünleriniz için uzatılmış garanti ve teknik destek hizmetleri sunan lider bir
                kuruluş.
              </p>
              <div className="flex space-x-3 mt-4">
                <a
                  href="#"
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <Facebook className="h-4 w-4 text-white" />
                </a>
                <a
                  href="#"
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <Twitter className="h-4 w-4 text-white" />
                </a>
                <a
                  href="#"
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <Instagram className="h-4 w-4 text-white" />
                </a>
                <a
                  href="#"
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <Linkedin className="h-4 w-4 text-white" />
                </a>
                <a
                  href="#"
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <Youtube className="h-4 w-4 text-white" />
                </a>
              </div>
            </div>

            {/* Hızlı Linkler */}
            <div className="col-span-1">
              <h3 className="text-white font-primary font-bold text-lg mb-4">Hızlı Linkler</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-white/80 hover:text-white transition-colors flex items-center">
                    <ArrowRight className="h-3 w-3 mr-2" />
                    Ana Sayfa
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-white/80 hover:text-white transition-colors flex items-center">
                    <ArrowRight className="h-3 w-3 mr-2" />
                    Hizmetlerimiz
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-white/80 hover:text-white transition-colors flex items-center">
                    <ArrowRight className="h-3 w-3 mr-2" />
                    Hakkımızda
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-white/80 hover:text-white transition-colors flex items-center">
                    <ArrowRight className="h-3 w-3 mr-2" />
                    İletişim
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-white/80 hover:text-white transition-colors flex items-center">
                    <ArrowRight className="h-3 w-3 mr-2" />
                    Sıkça Sorulan Sorular
                  </Link>
                </li>
              </ul>
            </div>

            {/* Kategoriler */}
            <div className="col-span-1">
              <h3 className="text-white font-primary font-bold text-lg mb-4">Kategoriler</h3>
              <ul className="space-y-2">
                {faqCategories.map((category) => (
                  <li key={category.id}>
                    <Link href="#" className="text-white/80 hover:text-white transition-colors flex items-center">
                      <ArrowRight className="h-3 w-3 mr-2" />
                      {category.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* İletişim */}
            <div className="col-span-1">
              <h3 className="text-white font-primary font-bold text-lg mb-4">İletişim</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <MapPin className="h-5 w-5 text-white/80 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white/80">Atatürk Mah. Ertuğrul Gazi Sok. No:23 Ataşehir, İstanbul</span>
                </li>
                <li className="flex items-center">
                  <Phone className="h-5 w-5 text-white/80 mr-3 flex-shrink-0" />
                  <span className="text-white/80">+90 (212) 123 45 67</span>
                </li>
                <li className="flex items-center">
                  <Mail className="h-5 w-5 text-white/80 mr-3 flex-shrink-0" />
                  <span className="text-white/80">info@agaranti.com.tr</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-white/80 text-sm">© {new Date().getFullYear()} A-Garanti. Tüm hakları saklıdır.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link href="#" className="text-white/80 hover:text-white transition-colors text-sm">
                Gizlilik Politikası
              </Link>
              <Link href="#" className="text-white/80 hover:text-white transition-colors text-sm">
                Kullanım Koşulları
              </Link>
              <Link href="#" className="text-white/80 hover:text-white transition-colors text-sm">
                KVKK
              </Link>
            </div>
          </div>
        </div>

        {/* Back to top button */}
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-primary shadow-lg flex items-center justify-center text-white hover:bg-primary/90 transition-colors z-10 focus:outline-none"
        >
          <ArrowUp className="h-6 w-6" />
        </button>
      </footer>
    </div>
  )
}

