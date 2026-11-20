import React, { useEffect, useState } from "react";
import logo from "./assets/ledlogo.png";
import * as XLSX from "xlsx";
import LedDimensionDiagram from "./LedDimensionDiagram.jsx";
import Product360 from "./Product360.jsx";
import LedDiagramPanel from "./LedDiagramPanel.jsx";

import {
  ArrowRight,
  ArrowUpRight,
  Menu,
  X,
  PanelsTopLeft,
  Wrench,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Zap,
  ShieldCheck,
  Sparkles,
  Search,
  CalendarDays,
  RefreshCw,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Trash2,
} from "lucide-react";

/* Portrait LED Display-д хэмжээний схем зурахгүй */
const showsDiagram = (name) => !/portrait/i.test(name || "");

/* Curved Module болон Numarsan-ийг нумарсан (муруй) хэлбэрээр зурна */
const isCurved = (name) => /curved|numarsan/i.test(name || "");

/* MG7S Cube-ийг куб (хайрцаг) хэлбэрээр зурна */
const isCube = (name) => /cube/i.test(name || "");

/* Module нь м²-аар бодогдоно, харин Curved Module, Numarsan 50×50 см cabinet-аар бодогдоно */
const isAreaModule = (name) => /module/i.test(name || "") && !isCurved(name);

/* =========================================
   SERVICES
========================================= */

const services = [
  {
    title: "Зөвлөгөө, төлөвлөлт",
    text: "Таны арга хэмжээ, төсөл, орон зай болон төсөвт тохирсон LED дэлгэц, дуу, гэрэлтүүлэг, тайзны тоног төхөөрөмжийн цогц шийдлийг боловсруулна.",
    icon: Sparkles,
  },
  {
    title: "Худалдаа, түрээс, нийлүүлэлт",
    text: "LED дэлгэц, дууны төхөөрөмж, утасгүй микрофон, гэрэлтүүлэг болон тайзны тоног төхөөрөмжийг худалдаа, түрээсээр нийлүүлнэ.",
    icon: PanelsTopLeft,
  },
  {
    title: "Угсралт, суурилуулалт",
    text: "LED дэлгэц, дууны систем, гэрэлтүүлэг, тайзны тоног төхөөрөмжийн угсралт, холболт, тохиргоог мэргэжлийн түвшинд гүйцэтгэнэ.",
    icon: Wrench,
  },
  {
    title: "Засвар, техникийн үйлчилгээ",
    text: "Тоног төхөөрөмжийн хэвийн ажиллагааг хангах үзлэг, оношилгоо, засвар, арчилгаа болон техникийн дэмжлэг үзүүлнэ.",
    icon: ShieldCheck,
  },
];

/* =========================================
   CATEGORIES
========================================= */

const categories = [
  "Бүгд",
  "LED дэлгэц",
  "Дуу, микрофоны төхөөрөмж",
  "Цахилгаан тоног төхөөрөмж",
  "Гэрэл",
  "MOKA",
  "Тайзны тоног төхөөрөмж",
];

/* =========================================
   PRODUCTS — 42 БҮТЭЭГДЭХҮҮН
========================================= */

export const products = [
  // 360° эргэлт: spin: { dir: "/images/.../хавтас", count: frame-ийн тоо }
  // 3D загвар нэмэх бол бүтээгдэхүүн дээр model талбар нэмнэ:
  // { name: "...", category: "...", image: "/images/x.webp", model: "/models/x.glb" },
  // LED ДЭЛГЭЦ
  { name: "LED Indoor Display", category: "LED дэлгэц", image: "/images/led/led_indoor.webp", spin: { dir: "/images/led/indoor360", count: 101 } },
  { name: "LED Outdoor Display", category: "LED дэлгэц", image: "/images/led/led_outdoor.webp" },
  { name: "Portrait LED Display", category: "LED дэлгэц", image: "/images/led/portrait_led_display.webp" },
  { name: "16x32 Module", category: "LED дэлгэц", image: "/images/led/16x32_module.webp" },
  { name: "Curved Module", category: "LED дэлгэц", image: "/images/led/curved_module.webp" },
  { name: "MG7S Cube", category: "LED дэлгэц", image: "/images/led/MG7S_cube.webp" },
  { name: "Numarsan", category: "LED дэлгэц", image: "/images/led/numarsan.webp" },
  { name: "Panel Module", category: "LED дэлгэц", image: "/images/led/panel_module.webp" },
  { name: "Transfer", category: "LED дэлгэц", image: "/images/led/transfer.webp" },
  { name: "Transfer 2", category: "LED дэлгэц", image: "/images/led/transfer_2.webp" },
  { name: "Transparent LED", category: "LED дэлгэц", image: "/images/led/transparent_LED.webp" },

  // ДУУ, МИКРОФОН
  { name: "Dual 18 Subwooer", category: "Дуу, микрофоны төхөөрөмж", image: "/images/sound/Dual_18_Subwoofer.webp" },
  { name: "Dual stage monitor speaker", category: "Дуу, микрофоны төхөөрөмж", image: "/images/sound/Dual_stage_monitor_speaker.webp" },
  { name: "High-Power monitor speaker", category: "Дуу, микрофоны төхөөрөмж", image: "/images/sound/High-Power_Point_Source_Speaker.webp" },
  { name: "Microphone Stand", category: "Дуу, микрофоны төхөөрөмж", image: "/images/sound/mic_stand.webp" },
  { name: "Monitor 1200w", category: "Дуу, микрофоны төхөөрөмж", image: "/images/sound/Monitor_1200w.webp" },
  { name: "Shure SLXD4D", category: "Дуу, микрофоны төхөөрөмж", image: "/images/sound/shure_slxd4d.webp" },
  { name: "Shure SLXD24D", category: "Дуу, микрофоны төхөөрөмж", image: "/images/sound/shure_SLXD24D.webp" },
  { name: "Single 15 Inch 1 Brilliant Bass Success", category: "Дуу, микрофоны төхөөрөмж", image: "/images/sound/Single_15_Inch_1_Brilliant_Bass_Success.webp" },
  { name: "STINGER 1000w", category: "Дуу, микрофоны төхөөрөмж", image: "/images/sound/STINGER_1000w.webp" },
  { name: "STINGER SUB 1200w", category: "Дуу, микрофоны төхөөрөмж", image: "/images/sound/STINGER_SUB_1200w.webp" },
  { name: "Tri amp line array system", category: "Дуу, микрофоны төхөөрөмж", image: "/images/sound/Tri-amp_line_array_system.webp" },

  // ЦАХИЛГААН
  { name: "Power Management", category: "Цахилгаан тоног төхөөрөмж", image: "/images/power_management.webp" },

  // ГЭРЭЛ
  { name: "BAR LIGHT", category: "Гэрэл", image: "/images/gerel/BAR_LIGTH.webp" },
  { name: "Beam 230W", category: "Гэрэл", image: "/images/gerel/beam_230w.webp" },
  { name: "Beam 380W", category: "Гэрэл", image: "/images/gerel/beam_380w.webp" },
  { name: "Beam Light 200W", category: "Гэрэл", image: "/images/gerel/beam_light_200w.webp" },
  { name: "Beam Light 400W ", category: "Гэрэл", image: "/images/gerel/beam_light_400w.webp" },
  { name: "Beam Light 500W", category: "Гэрэл", image: "/images/gerel/beam_light_500w.webp" },
  { name: "Blender Light", category: "Гэрэл", image: "/images/gerel/blender_light.webp" },
  { name: "Follow Spotlight", category: "Гэрэл", image: "/images/gerel/follow_spotligth.webp" },
  { name: "LED Strobe", category: "Гэрэл", image: "/images/gerel/LED_Strobe.webp" },
  { name: "LED PAR Light", category: "Гэрэл", image: "/images/gerel/led-par_ligth.webp" },
  { name: "Par RGB", category: "Гэрэл", image: "/images/gerel/par_rgb.webp" },
  { name: "Par", category: "Гэрэл", image: "/images/gerel/par.webp" },
  { name: "Surface Warm Light", category: "Гэрэл", image: "/images/gerel/surface_warm_ligth.webp" },
  { name: "Waterproof PAR Light", category: "Гэрэл", image: "/images/gerel/waterroof_par_ligth.webp" },

  // MOKA
  { name: "MOKA SFX 900W Spark Machine", category: "MOKA", image: "/images/moka/MOKA_SFX_900W_Spark_Machine.webp" },
  { name: "MOKA SFX H-F01 Smoke Machine", category: "MOKA", image: "/images/moka/MOKA_SFX_H-F01_Smoke_Machine.webp" },

  // ТАЙЗ
  { name: "Stage Module 1x2m", category: "Тайзны тоног төхөөрөмж", image: "/images/Stage_Module_1x2m.webp" },
  { name: "Truss", category: "Тайзны тоног төхөөрөмж", image: "/images/truss.webp" },
  { name: "Barrier Post", category: "Тайзны тоног төхөөрөмж", image: "/images/Elegant_barrier_post_golden.webp" },
];

/* =========================================
   PRODUCT DESCRIPTIONS
========================================= */

const productDescriptions = {
  "LED Indoor Display": {
    description: "Дотор орчны дүрс, видео, текст болон сурталчилгааны контентыг өндөр нягтралтай харуулах зориулалттай мэргэжлийн LED дэлгэц.",
    usage: "Хурлын танхим, худалдааны төв, студи, концерт, тайз, үзэсгэлэн.",
    feature: "Өндөр дүрсний чанар, тод өнгө, модульчлагдсан бүтэц.",
  },
  "LED Outdoor Display": {
    description: "Гадна орчны цаг агаарын нөхцөлд ажиллах зориулалттай, холоос тод харагдах LED дэлгэц.",
    usage: "Барилгын фасад, гудамж талбай, сурталчилгааны самбар, гадна эвент.",
    feature: "Гадна орчны хэрэглээнд зориулсан хамгаалалттай хийц.",
  },
  "Portrait LED Display": {
    description: "Босоо хэлбэрийн LED дэлгэц. Видео, зураг болон мэдээллийг босоо форматаар харуулах шийдэл.",
    usage: "Лобби, худалдааны төв, үзэсгэлэн, сурталчилгаа.",
    feature: "Босоо байрлалтай дүрслэл, динамик контент.",
  },
  "16x32 Module": {
    description: "LED дэлгэцийн дүрс үүсгэх үндсэн модуль. Олон модулийг нэгтгэн том хэмжээний дэлгэц бүтээнэ.",
    usage: "LED дэлгэц угсралт, засвар үйлчилгээ, модуль солих.",
    feature: "Модульчлагдсан бүтэц.",
  },
  "Curved Module": {
    description: "Муруй хэлбэрийн LED дэлгэц угсрах зориулалттай тусгай модуль.",
    usage: "Муруй тайз, дугуй байгууламж, архитектурын LED дэлгэц.",
    feature: "Муруй гадаргуу үүсгэх боломжтой бүтэц.",
  },
  "MG7S Cube": {
    description: "Тусгай хэлбэрийн LED дүрслэлийн шийдэл. Орчны дизайн болон бүтээлч дэлгэцийн байгууламжид ашиглана.",
    usage: "Тайз, үзэсгэлэн, шоу, интерьер дизайн.",
    feature: "Өвөрмөц хэлбэрийн LED дүрслэл.",
  },
  "Numarsan": {
    description: "LED дэлгэцийн бүтээгдэхүүн. Төслийн хэмжээ болон угсралтын шаардлагад тохируулан ашиглана.",
    usage: "LED дэлгэцийн байгууламж, тайз, эвент.",
    feature: "Загварын нарийвчилсан үзүүлэлтийг нийлүүлэгчээс баталгаажуулна.",
  },
  "Panel Module": {
    description: "LED дэлгэцийн үндсэн панель болон модуль угсралтын зориулалттай бүтээгдэхүүн.",
    usage: "LED дэлгэцийн угсралт, өргөтгөл, засвар.",
    feature: "Панель хэлбэрийн угсралтын шийдэл.",
  },
  "Transfer": {
    description: "LED дэлгэцийн тоноглолын дагалдах бүтээгдэхүүн. Зориулалт болон холболтын төрлийг загвараар баталгаажуулна.",
    usage: "LED дэлгэцийн тоноглол, угсралтын систем.",
    feature: "Бүтээгдэхүүний загвараас хамаарсан ашиглалт.",
  },
  "Transfer 2": {
    description: "LED дэлгэцийн системд ашиглах нэмэлт тоноглол.",
    usage: "LED дэлгэцийн угсралт болон холболтын шийдэл.",
    feature: "Техникийн үзүүлэлтийг нийлүүлэгчийн мэдээллээр баталгаажуулна.",
  },
  "Transparent LED": {
    description: "Гэрэл нэвтрүүлэх боломжтой тунгалаг LED дэлгэц. Шилэн гадаргуу болон архитектурын орчинд дүрс харуулах шийдэл.",
    usage: "Шилэн фасад, худалдааны төв, үзэсгэлэн, интерьер.",
    feature: "Тунгалаг хийцтэй LED дүрслэл.",
  },
  "Dual 18 Subwooer": {
    description: "Хоёр ширхэг 18 инчийн нам давтамжийн чанга яригч бүхий сабвуфер төрлийн төхөөрөмж.",
    usage: "Концерт, томоохон эвент, тайз, мэргэжлийн дууны систем.",
    feature: "Гүн нам давтамжийн дуу гаргах зориулалттай.",
  },
  "Dual stage monitor speaker": {
    description: "Тайзан дээр ажиллаж буй хөгжимчин, дуучин болон илтгэгчид өөрийн дууг хянах зориулалттай монитор чанга яригч.",
    usage: "Концерт, тайз, амьд хөгжмийн тоглолт.",
    feature: "Тайзны ойрын зайн дууны хяналт.",
  },
  "High-Power monitor speaker": {
    description: "Өндөр чадлын монитор чанга яригч. Тайз болон мэргэжлийн дууны хяналтад ашиглана.",
    usage: "Тоглолт, тайз, студи, эвент.",
    feature: "Өндөр чадлын дууны хяналтын шийдэл.",
  },
  "Microphone Stand": {
    description: "Микрофоныг тогтвортой байрлуулах, өндрийг тохируулах зориулалттай мэргэжлийн суурь.",
    usage: "Хурал, студи, тайз, тоглолт, илтгэл.",
    feature: "Тохируулгатай байрлал, тогтвортой суурь.",
  },
  "Monitor 1200w": {
    description: "1200W гэж нэрлэгдсэн чадлын үзүүлэлттэй монитор чанга яригчийн бүтээгдэхүүн.",
    usage: "Тайз, амьд хөгжмийн тоглолт, эвент.",
    feature: "Тайзны дууны мониторинг.",
  },
  "Shure SLXD4D": {
    description: "Shure SLX-D цувралын утасгүй микрофоны хүлээн авагч төхөөрөмж. Утасгүй микрофоны системийн бүрэлдэхүүн хэсэг.",
    usage: "Хурал, илтгэл, концерт, тайзны арга хэмжээ.",
    feature: "Дижитал утасгүй микрофоны систем.",
  },
  "Shure SLXD24D": {
    description: "Shure SLX-D цувралын утасгүй микрофоны системийн загвар.",
    usage: "Хурал, тоглолт, илтгэл, мэргэжлийн дууны систем.",
    feature: "Утасгүй дуу дамжуулалтын шийдэл.",
  },
  "Single 15 Inch 1 Brilliant Bass Success": {
    description: "15 инчийн нам давтамжийн чанга яригчийн бүтээгдэхүүн. Дууны системийн басс хэсгийг дэмжинэ.",
    usage: "Тайз, эвент, хөгжмийн тоглолт.",
    feature: "15 инчийн чанга яригчийн хийц.",
  },
  "STINGER 1000w": {
    description: "STINGER цувралын 1000W гэж нэрлэгдсэн чанга яригч. Мэргэжлийн дууны системд ашиглана.",
    usage: "Тоглолт, хурал, эвент, тайз.",
    feature: "Дуу өсгөлтийн зориулалттай төхөөрөмж.",
  },
  "STINGER SUB 1200w": {
    description: "STINGER цувралын 1200W гэж нэрлэгдсэн сабвуфер төхөөрөмж. Нам давтамжийн дууг гаргахад ашиглана.",
    usage: "Концерт, эвент, тайз, мэргэжлийн дууны систем.",
    feature: "Нам давтамжийн дууны шийдэл.",
  },
  "Tri amp line array system": {
    description: "Гурван өсгөлтийн замтай Line Array төрлийн мэргэжлийн чанга яригчийн систем.",
    usage: "Томоохон концерт, фестиваль, задгай талбай, тайз.",
    feature: "Олон чанга яригчийг нэгтгэн дуу түгээх систем.",
  },
  "Power Management": {
    description: "Тайз, LED дэлгэц болон дуу гэрлийн тоног төхөөрөмжийн цахилгаан хангамжийг зохион байгуулах зориулалттай төхөөрөмж.",
    usage: "Тайз, LED дэлгэц, концерт, эвент.",
    feature: "Тэжээлийн зохион байгуулалтын шийдэл.",
  },
  "BAR LIGHT": {
    description: "BAR төрлийн LED гэрэлтүүлэг. Тайзны өргөн хэсэг болон арын фон гэрэлтүүлэхэд ашиглана.",
    usage: "Тайз, шоу, эвент, студи.",
    feature: "Шугаман хэлбэрийн гэрэлтүүлэг.",
  },
  "Beam 230W": {
    description: "230W гэж нэрлэгдсэн Beam төрлийн хөдөлгөөнт гэрэлтүүлэг. Нарийн гэрлийн цацраг болон эффект үүсгэнэ.",
    usage: "Концерт, шоу, тайз, эвент.",
    feature: "Хөдөлгөөнт гэрлийн цацраг.",
  },
  "Beam 380W": {
    description: "380W гэж нэрлэгдсэн Beam төрлийн хөдөлгөөнт гэрэлтүүлэг. Томоохон тайзны гэрлийн эффектэд ашиглана.",
    usage: "Концерт, фестиваль, шоу тоглолт.",
    feature: "Өндөр чадлын Beam гэрэлтүүлгийн шийдэл.",
  },
  "Beam Light 200W": {
    description: "200W чадлын ангиллын Beam гэрэлтүүлэг. Тайзны хөдөлгөөнт гэрлийн эффект үүсгэнэ.",
    usage: "Жижиг болон дунд хэмжээний тайз, эвент.",
    feature: "Хөдөлгөөнт гэрлийн эффект.",
  },
  "Beam Light 400W ": {
    description: "400W чадлын ангиллын Beam гэрэлтүүлэг. Тайзны гэрлийн хүчтэй цацраг үүсгэх зориулалттай.",
    usage: "Концерт, томоохон эвент, шоу.",
    feature: "Өндөр чадлын хөдөлгөөнт гэрэлтүүлэг.",
  },
  "Beam Light 500W": {
    description: "500W чадлын ангиллын Beam гэрэлтүүлэг. Мэргэжлийн тайзны гэрлийн эффектэд ашиглана.",
    usage: "Томоохон концерт, шоу, фестиваль.",
    feature: "Өндөр чадлын гэрлийн шийдэл.",
  },
  "Blender Light": {
    description: "Тайз болон арга хэмжээний өнгө, гэрлийн эффект үүсгэх зориулалттай гэрэлтүүлгийн төхөөрөмж.",
    usage: "Тайз, шоу, концерт, эвент.",
    feature: "Гэрлийн эффект болон өнгөний зохицуулалт.",
  },
  "Follow Spotlight": {
    description: "Тайзан дээрх гол дүр, жүжигчин болон илтгэгчийг дагуулан гэрэлтүүлэх зориулалттай прожектор.",
    usage: "Театр, концерт, ёслолын арга хэмжээ.",
    feature: "Чиглүүлсэн гэрэлтүүлэг.",
  },
  "LED Strobe": {
    description: "Хурдан анивчих гэрлийн эффект үүсгэх зориулалттай LED строб гэрэл.",
    usage: "Концерт, DJ шоу, клуб, эвент.",
    feature: "Strobe буюу анивчих гэрлийн эффект.",
  },
  "LED PAR Light": {
    description: "Өнгөний гэрэлтүүлэг болон тайзны фон үүсгэх зориулалттай LED PAR гэрэл.",
    usage: "Тайз, студи, эвент, үзэсгэлэн.",
    feature: "LED өнгөний гэрэлтүүлэг.",
  },
  "Par RGB": {
    description: "RGB өнгөний гэрэлтүүлэг үүсгэх зориулалттай PAR төрлийн гэрэл.",
    usage: "Тайз, концерт, эвент, интерьер.",
    feature: "RGB өнгөний сонголт.",
  },
  "Par": {
    description: "Тайз болон орчны гэрэлтүүлэгт ашиглах PAR төрлийн гэрлийн төхөөрөмж.",
    usage: "Тайз, студи, эвент.",
    feature: "Чиглүүлсэн гэрэлтүүлэг.",
  },
  "Surface Warm Light": {
    description: "Дулаан өнгийн гэрэлтүүлэг үүсгэх зориулалттай гэрлийн төхөөрөмж.",
    usage: "Студи, тайз, үзэсгэлэн, интерьер.",
    feature: "Дулаан өнгийн гэрэлтүүлэг.",
  },
  "Waterproof PAR Light": {
    description: "Ус, чийгний хамгаалалттай PAR төрлийн гэрэлтүүлгийн төхөөрөмж.",
    usage: "Гадна талбайн эвент, тайз, архитектурын гэрэлтүүлэг.",
    feature: "Ус, чийгний хамгаалалттай хийц.",
  },
  "MOKA SFX 900W Spark Machine": {
    description: "900W гэж нэрлэгдсэн MOKA Spark Machine. Тусгай очны эффект үүсгэх зориулалттай SFX төхөөрөмж.",
    usage: "Концерт, шоу, хурим, тайзны тусгай эффект.",
    feature: "Spark төрлийн тусгай эффект.",
  },
  "MOKA SFX H-F01 Smoke Machine": {
    description: "MOKA SFX цувралын утаа үүсгэх төхөөрөмж. Тайзны гэрлийн эффект болон орчны дүрслэлийг тодотгоход ашиглана.",
    usage: "Концерт, клуб, тайз, шоу, эвент.",
    feature: "Smoke буюу утааны эффект.",
  },
  "Stage Module 1x2m": {
    description: "1 × 2 метр хэмжээтэй тайзны модуль. Хэрэгцээт хэмжээ, хэлбэрээр тайзны тавцан угсрах боломжтой.",
    usage: "Концерт, хурал, эвент, үзэсгэлэн.",
    feature: "Модульчлагдсан тайзны бүтэц.",
  },
  "Truss": {
    description: "Гэрэл, дуу болон бусад тайзны тоног төхөөрөмжийг байрлуулах зориулалттай фермэн хийц.",
    usage: "Тайз, концерт, эвент, үзэсгэлэн.",
    feature: "Тоног төхөөрөмж бэхлэх зориулалттай бүтэц.",
  },
  "Barrier Post": {
    description: "Хүмүүсийн хөдөлгөөнийг зохицуулах, тодорхой бүс үүсгэх зориулалттай гоёлын тусгаарлагч багана.",
    usage: "Хүлээн авалт, концерт, арга хэмжээ, зочдын бүс.",
    feature: "Урсгал зохицуулалт, бүсчлэл.",
  },
};

/* =========================================
   COMMON HELPERS
========================================= */

const formatMoney = (value) =>
  `${Number(value || 0).toLocaleString("mn-MN")}₮`;

/* =========================================
   HERO VISUAL
========================================= */

function ScreenVisual() {
  return (
    <div className="screen-scene" aria-label="LED дэлгэцийн дүрслэл">
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="screen-glow" />

      <div className="led-screen">
        <div className="screen-top">
          <span>LED MONGOLIA</span>
          <span className="live"><i /> LIVE DISPLAY</span>
        </div>

        <div className="screen-content">
          <div className="screen-kicker">VISUAL TECHNOLOGY</div>
          <div className="screen-title">
            SEE
            <br />
            <b>BEYOND.</b>
          </div>
          <div className="screen-line" />
          <div className="screen-sub">
            YOUR MESSAGE.
            <br />
            BIGGER & BRIGHTER.
          </div>
        </div>

        <div className="pixel-grid" />
      </div>

      <div className="scene-floor" />

      <div className="floating-chip chip-a">
        <Zap size={14} />
        HIGH BRIGHTNESS
      </div>

      <div className="floating-chip chip-b">
        <span className="chip-dot" />
        PRECISION PIXELS
      </div>
    </div>
  );
}

/* =========================================
   HEADER
========================================= */

function Header() {
  const [open, setOpen] = useState(false);

  const links = [
    ["Эвентүүд", "#events"],
    ["Бүтээгдэхүүн", "#products"],
    ["Үнийн санал", "#quote"],
    ["Бидний тухай", "#about"],
    ["Үйлчилгээ", "#services"],
    ["Холбоо барих", "#contact"],
  ];

  const closeMenu = () => setOpen(false);

  return (
    <header className="header">
      <a className="brand" href="#home" aria-label="LED Mongolia нүүр хуудас">
        <img className="brand-logo" src={logo} alt="LED Mongolia — Visual Technology" />
      </a>

      <nav className={open ? "nav nav-open" : "nav"}>
        {links.map(([label, href]) => (
          <a key={href} href={href} onClick={closeMenu}>
            {label}
          </a>
        ))}

        <a className="nav-cta" href="#quote" onClick={closeMenu}>
          Үнийн санал авах
          <ArrowUpRight size={16} />
        </a>
      </nav>

      <button
        className="menu-btn"
        type="button"
        aria-label={open ? "Цэс хаах" : "Цэс нээх"}
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
      >
        {open ? <X /> : <Menu />}
      </button>
    </header>
  );
}

/* =========================================
   EVENTS
========================================= */

function EventSection() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [errors, setErrors] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeEventIndex, setActiveEventIndex] = useState(0);

  const loadEvents = async (force = false) => {
    try {
      setRefreshing(force);

      const response = await fetch(`/api/events${force ? "?refresh=1" : ""}`);

      if (!response.ok) {
        throw new Error(`Мэдээлэл татахад алдаа гарлаа (${response.status})`);
      }

      const data = await response.json();

      setEvents(Array.isArray(data.events) ? data.events : []);
      setUpdatedAt(data.updatedAt ? new Date(data.updatedAt) : null);
      setErrors(data.errors || []);
    } catch (error) {
      setErrors([{ source: "Сервер", message: error.message }]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEvents();

    const timer = window.setInterval(
      () => loadEvents(true),
      5 * 60 * 1000
    );

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (events.length <= 3) {
      setActiveEventIndex(0);
      return undefined;
    }

    const slideTimer = window.setInterval(() => {
      setActiveEventIndex((current) => (current + 1) % events.length);
    }, 5000);

    return () => window.clearInterval(slideTimer);
  }, [events.length]);

  const visibleEvents = events.length
    ? Array.from(
        { length: Math.min(3, events.length) },
        (_, offset) => events[(activeEventIndex + offset) % events.length]
      )
    : [];

  const showPreviousEvents = () => {
    if (events.length > 1) {
      setActiveEventIndex(
        (current) => (current - 1 + events.length) % events.length
      );
    }
  };

  const showNextEvents = () => {
    if (events.length > 1) {
      setActiveEventIndex((current) => (current + 1) % events.length);
    }
  };

  return (
    <section className="events-section section" id="events">
      <div className="events-head">
        <div>
          <div className="section-tag">LIVE EVENT FEED — TICKET.MN / PORTAL.MN</div>
          <h2>Удахгүй болох <span>эвентүүд</span></h2>
          <p>Ticket.mn болон Portal.mn сайтуудын нээлттэй эвентийн мэдээллийг нэг дороос.</p>
        </div>

        <button
          className="events-refresh"
          type="button"
          onClick={() => loadEvents(true)}
          disabled={loading || refreshing}
        >
          <RefreshCw size={16} className={refreshing ? "is-spinning" : ""} />
          Шинэчлэх
        </button>
      </div>

      <div className="events-status">
        <span>
          <i className="events-live-dot" />
          {loading ? "Мэдээлэл татаж байна..." : `${events.length} эвент олдлоо`}
        </span>
        {updatedAt && (
          <small>Сүүлд шинэчилсэн: {updatedAt.toLocaleString("mn-MN")}</small>
        )}
      </div>

      {errors.length > 0 && (
        <div className="events-notice" role="status">
          Зарим эх сурвалжаас мэдээлэл татаж чадсангүй:{" "}
          {errors.map((e) => `${e.source} (${e.message})`).join(" · ")}.
          Дахин шинэчлэх товчийг дарж оролдоно уу.
        </div>
      )}

      {loading ? (
        <div className="events-empty">Эвентийн мэдээлэл ачаалж байна...</div>
      ) : events.length ? (
        <>
          <div className="events-carousel-controls">
            <span>{activeEventIndex + 1} / {events.length}</span>
            <div className="events-carousel-buttons">
              <button
                type="button"
                onClick={showPreviousEvents}
                disabled={events.length <= 1}
                aria-label="Өмнөх эвентүүд"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={showNextEvents}
                disabled={events.length <= 1}
                aria-label="Дараагийн эвентүүд"
              >
                ›
              </button>
            </div>
          </div>

          <div className="events-grid">
            {visibleEvents.map((event, index) => (
              <article
                className="event-card"
                key={`${event.source}-${event.url}-${index}`}
              >
                <a
                  className="event-card-image"
                  href={event.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${event.title} эх сайт дээр нээх`}
                >
                  {event.image ? (
                    <img src={event.image} alt="" loading="lazy" />
                  ) : (
                    <div className="event-image-placeholder">
                      <CalendarDays size={34} />
                    </div>
                  )}
                  <span className="event-source">{event.source}</span>
                </a>

                <div className="event-card-body">
                  <span className="event-card-date">
                    {event.date || "Огноо тодорхойгүй"}
                  </span>
                  <h3>{event.title}</h3>
                  {event.venue && <p>{event.venue}</p>}
                  {event.price && <strong className="event-price">{event.price}</strong>}
                  <a
                    className="event-card-link"
                    href={event.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Эх сайтаас үзэх <ExternalLink size={15} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="events-empty">
          Одоогоор автоматаар уншигдах эвент олдсонгүй. Эх сайтуудын хамгаалалт
          эсвэл мэдээллийн бүтэц өөрчлөгдсөн байж болно. Дахин шинэчилж үзээрэй.
        </div>
      )}
    </section>
  );
}

/* =========================================
   QUOTE CALCULATOR
========================================= */

function QuoteSection({
  items,
  setItems,
  installation,
  setInstallation,
  products,
}) {
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "", address: "", dateFrom: "", dateTo: "" });
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [admin, setAdmin] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [prices, setPrices] = useState({});
  const [installationFee, setInstallationFee] = useState(0);
  const [savingPrices, setSavingPrices] = useState(false);
  const [quoteReceipt, setQuoteReceipt] = useState(() => { try { return JSON.parse(localStorage.getItem("led_quote_receipt") || "null"); } catch { return null; } });
  const [quoteStatus, setQuoteStatus] = useState(null);
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [quoteSubmitError, setQuoteSubmitError] = useState("");

  // LED дэлгэцийн cabinet нь 50см × 50см. Module төрлийн бүтээгдэхүүн м²-аар бодогдоно.
  const hasLed = items.some((item) => item.width !== undefined && item.height !== undefined);
  const hasDimensions = (item) => item.width !== undefined && item.height !== undefined;
  const getAmount = (item) => {
    if (item.unit === "м²") {
      return (Number(item.width) || 0) * (Number(item.height) || 0) * (Number(item.quantity) || 0);
    }
    if (item.measurement === "cabinet") {
      const across = Math.ceil((Number(item.width) || 0) / 0.5);
      const down = Math.ceil((Number(item.height) || 0) / 0.5);
      return across * down * (Number(item.quantity) || 0);
    }
    return Number(item.quantity) || 0;
  };

  useEffect(() => {
    if (!quoteReceipt?.id || !quoteReceipt?.accessToken) return;
    let active = true;
    const check = () => fetch(`/api/quotes/${quoteReceipt.id}?token=${encodeURIComponent(quoteReceipt.accessToken)}`)
      .then(r => r.ok ? r.json() : null).then(data => { if (active && data) setQuoteStatus(data); }).catch(() => {});
    check();
    const timer = window.setInterval(check, 10000);
    return () => { active = false; window.clearInterval(timer); };
  }, [quoteReceipt]);

  const submitQuoteRequest = async () => {
    setSubmittingQuote(true); setQuoteSubmitError("");
    try {
      const response = await fetch("/api/quotes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer, items, installation }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Хүсэлт илгээж чадсангүй.");
      const receipt = { id: data.id, accessToken: data.accessToken };
      localStorage.setItem("led_quote_receipt", JSON.stringify(receipt));
      setQuoteReceipt(receipt); setQuoteStatus({ status: "pending" }); setItems([]);
    } catch (error) { setQuoteSubmitError(error.message); }
    finally { setSubmittingQuote(false); }
  };

  const subtotal = items.reduce((sum, item) => sum + getAmount(item) * (Number(prices[item.name]) || 0), 0);
  const total = subtotal + (installation ? installationFee : 0);

  const updateItem = (index, field, value) => {
    setItems((previous) => previous.map((item, i) => i === index
      ? { ...item, [field]: value === "" ? "" : Number(value) }
      : item));
  };
  const removeItem = (index) => setItems((previous) => previous.filter((_, i) => i !== index));

  const login = async (event) => {
    event.preventDefault();
    setAdminError("");
    try {
      const response = await fetch("/api/admin/login", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ password: adminPassword }),
});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Нэвтрэх боломжгүй.");
      setAdmin(true);
      setAdminPassword("");
    } catch (error) {
      setAdminError(error.message);
    }
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    setAdmin(false);
    setPrices({});
    setInstallationFee(0);
  };

  const savePrices = async () => {
    setSavingPrices(true);
    setAdminError("");
    try {
      const response = await fetch("/api/admin/prices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prices, installationFee }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Хадгалах үед алдаа гарлаа.");
      setPrices(data.prices || prices);
      setInstallationFee(Number(data.installationFee) || 0);
      setAdminError("Үнийн мэдээлэл амжилттай хадгалагдлаа.");
    } catch (error) {
      setAdminError(error.message);
    } finally {
      setSavingPrices(false);
    }
  };

  const downloadExcel = () => {
    if (!items.length || !admin) return;
    const rows = [
      ["LED MONGOLIA — ҮНИЙН САНАЛ"],
      ["Огноо", new Date().toLocaleDateString("mn-MN")],
      ["Харилцагч", customer.name],
      ["Утас", customer.phone],
      ["Хаяг", customer.address],
      ["Хугацаа", `${customer.dateFrom || "-"} — ${customer.dateTo || "-"}`],
      [],
      ["№", "Бүтээгдэхүүн", "Ангилал", "Өргөн (м)", "Өндөр (м)", "Нэгж", "Тоо", "Нийт м² / ш", "Нэгж үнэ", "Нийт үнэ"],
      ...items.map((item, index) => [
        index + 1, item.name, item.category,
        hasDimensions(item) ? Number(item.width) || 0 : "-",
        hasDimensions(item) ? Number(item.height) || 0 : "-",
        item.unit, Number(item.quantity) || 0, getAmount(item),
        Number(prices[item.name]) || 0, getAmount(item) * (Number(prices[item.name]) || 0),
      ]),
      [],
      ["", "", "", "", "", "", "", "", "Бүтээгдэхүүний дүн", subtotal],
      ["", "", "", "", "", "", "", "", "Суурилуулалт", installation ? installationFee : 0],
      ["", "", "", "", "", "", "", "", "Хүргэлт", "Үнэгүй"],
      ["", "", "", "", "", "", "", "", "НИЙТ ДҮН", total],
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet["!cols"] = [{wch:6},{wch:35},{wch:27},{wch:13},{wch:13},{wch:12},{wch:10},{wch:17},{wch:22},{wch:18}];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Үнийн санал");
    XLSX.writeFile(workbook, `LED-Mongolia-Quote-${Date.now()}.xlsx`);
  };

  const printQuote = () => {
    if (items.length && admin) window.print();
  };

  return (
    <section className="quote-page section" id="quote">
      <div className="quote-inner" id="quote-print-area">
        <div className="quote-heading">
          <div>
            <div className="section-tag">05 — ҮНИЙН САНАЛ</div>
            <h2>Төслийнхөө <span>үнийн хүсэлтээ гаргая.</span></h2>
            <p>Бүтээгдэхүүнээ сонгож, хэмжээ болон тоо ширхэгээ оруулан хүсэлтээ илгээнэ үү. Үнийг манай админ боловсруулна.</p>
          </div>
        </div>



        <div className="quote-customer">
          <label>Харилцагчийн нэр<input value={customer.name} onChange={(e) => setCustomer((p) => ({...p, name:e.target.value}))} placeholder="Нэрээ оруулна уу" /></label>
          <label>Имэйл хаяг<input type="email" required value={customer.email} onChange={(e) => setCustomer((p) => ({...p, email:e.target.value}))} placeholder="name@example.com" /></label>
          <label>Утасны дугаар<input value={customer.phone} onChange={(e) => setCustomer((p) => ({...p, phone:e.target.value}))} placeholder="Утасны дугаар" /></label>
          <label>Байршил / хаяг<input value={customer.address} onChange={(e) => setCustomer((p) => ({...p, address:e.target.value}))} placeholder="Суурилуулах хаяг" /></label>
          <label>Эхлэх огноо<input type="date" value={customer.dateFrom} onChange={(e) => setCustomer((p) => ({...p, dateFrom:e.target.value, dateTo: p.dateTo && e.target.value && p.dateTo < e.target.value ? "" : p.dateTo}))} /></label>
          <label>Дуусах огноо<input type="date" value={customer.dateTo} min={customer.dateFrom || undefined} onChange={(e) => setCustomer((p) => ({...p, dateTo:e.target.value}))} /></label>
        </div>

        <div className="quote-table-wrap">
          <table className="quote-table">
            <thead><tr>
              <th>№</th><th>Бүтээгдэхүүн</th>
              {hasLed && <><th>Өргөн (м)</th><th>Өндөр (м)</th></>}
              <th>Нэгж</th><th>{hasLed ? "Тоо / дэлгэц" : "Тоо хэмжээ"}</th><th>Нийт м² / ш</th>
              {admin && <><th>Нэгж үнэ</th><th>Нийт үнэ</th></>}
              <th className="quote-no-print">Устгах</th>
            </tr></thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={admin ? (hasLed ? 10 : 8) : (hasLed ? 8 : 6)} className="quote-empty">Одоогоор бүтээгдэхүүн сонгоогүй байна. Бүтээгдэхүүний хэсгээс сонгоно уу.</td></tr>
              ) : items.map((item, index) => {
                const price = Number(prices[item.name]) || 0;
                return <React.Fragment key={`${item.name}-${index}`}><tr>
                  <td>{index + 1}</td>
                  <td><strong>{item.name}</strong><small>{item.category}</small></td>
                  {hasLed && <><td>{hasDimensions(item) ? <input className="quote-quantity" type="number" min="0.1" step="0.1" value={item.width ?? 1} onChange={(e) => updateItem(index, "width", e.target.value)} aria-label={`${item.name} өргөн метрээр`} /> : "—"}</td>
                  <td>{hasDimensions(item) ? <input className="quote-quantity" type="number" min="0.1" step="0.1" value={item.height ?? 1} onChange={(e) => updateItem(index, "height", e.target.value)} aria-label={`${item.name} өндөр метрээр`} /> : "—"}</td></>}
                  <td>{item.unit}</td>
                  <td><input className="quote-quantity" type="number" min="1" step="1" value={item.quantity} onChange={(e) => updateItem(index, "quantity", e.target.value)} aria-label={`${item.name} тоо хэмжээ`} /></td>
                  <td><strong>{getAmount(item).toLocaleString("mn-MN")}</strong></td>
                  {admin && <><td>{formatMoney(price)}</td><td><strong>{formatMoney(getAmount(item) * price)}</strong></td></>}
                  <td className="quote-no-print"><button className="quote-remove" type="button" onClick={() => removeItem(index)} aria-label={`${item.name} устгах`}><Trash2 size={15} /></button></td>
                </tr>{hasDimensions(item) && showsDiagram(item.name) && <tr className="quote-diagram-row"><td colSpan={admin ? (hasLed ? 10 : 8) : (hasLed ? 8 : 6)}><LedDimensionDiagram width={item.width} height={item.height} quantity={item.quantity} measurement={item.measurement} curved={isCurved(item.name)} cube={isCube(item.name)} /></td></tr>}</React.Fragment>;
              })}
            </tbody>
          </table>
        </div>

        {admin ? (
          <>
            <div className="quote-installation quote-no-print">
              <label><input type="checkbox" checked={installation} onChange={(e) => setInstallation(e.target.checked)} /> Суурилуулалтын үйлчилгээ нэмэх (10 хүн)</label>
              <strong>{formatMoney(installationFee)}</strong>
            </div>
            <div className="quote-summary">
              <div><span>Бүтээгдэхүүний дүн</span><strong>{formatMoney(subtotal)}</strong></div>
              <div><span>Суурилуулалт (10 хүн)</span><strong>{formatMoney(installation ? installationFee : 0)}</strong></div>
              <div><span>Хүргэлт</span><strong>Үнэгүй</strong></div>
              <div className="quote-total"><span>НИЙТ ДҮН</span><strong>{formatMoney(total)}</strong></div>
            </div>
            <div className="quote-actions quote-no-print">
              <button type="button" onClick={downloadExcel} disabled={!items.length}><FileSpreadsheet size={17} />Excel татах</button>
              <button type="button" onClick={printQuote} disabled={!items.length}><FileText size={17} />PDF татах / Хэвлэх</button>
              <button type="button" onClick={() => setItems([])} disabled={!items.length}><Trash2 size={17} />Бүгдийг арилгах</button>
            </div>
          </>
        ) : (
          <div className="quote-customer-note">
            <div><p>Таны хүсэлт Admin-д очно. Admin үнэ баталгаажуулсны дараа үнийн санал энэ хэсэгт автоматаар харагдана.</p>
              {quoteStatus?.status === "pending" && <p className="quote-status-message">Таны хүсэлт хүлээн авлаа. Админ үнийн санал боловсруулж байна.</p>}
              {quoteStatus?.status === "approved" && quoteStatus.approvedPrices && <div className="approved-quote"><h3>Таны баталгаажсан үнийн санал</h3>{quoteStatus.items.map((item, i) => { const amountValue = item.measurement === "cabinet" ? Math.ceil(item.width / .5) * Math.ceil(item.height / .5) * item.quantity : item.unit === "м²" ? item.width * item.height * item.quantity : item.quantity; const price = Number(quoteStatus.approvedPrices.prices[item.name]) || 0; return <div className="approved-quote-item" key={i}><p>{item.name} — {amountValue} {item.measurement === "cabinet" ? "ш" : item.unit}: <strong>{formatMoney(amountValue * price)}</strong></p>{item.width && item.height && showsDiagram(item.name) && <LedDimensionDiagram width={item.width} height={item.height} quantity={item.quantity} measurement={item.measurement} curved={isCurved(item.name)} cube={isCube(item.name)} />}</div>; })}<p>Суурилуулалт: <strong>{formatMoney(quoteStatus.approvedPrices.installation ? quoteStatus.approvedPrices.installationFee : 0)}</strong></p><h3>Нийт: {formatMoney(quoteStatus.items.reduce((sum,item)=>{const amountValue=item.measurement==="cabinet"?Math.ceil(item.width/.5)*Math.ceil(item.height/.5)*item.quantity:item.unit==="м²"?item.width*item.height*item.quantity:item.quantity;return sum+amountValue*(Number(quoteStatus.approvedPrices.prices[item.name])||0)},0)+(quoteStatus.approvedPrices.installation?quoteStatus.approvedPrices.installationFee:0))}</h3>{quoteStatus.approvedPrices.note && <p>{quoteStatus.approvedPrices.note}</p>}</div>}
            </div>
            <button type="button" className="btn btn-primary" disabled={!items.length || !customer.name.trim() || !customer.phone.trim() || !customer.email.trim() || submittingQuote} onClick={submitQuoteRequest}>{submittingQuote ? "Илгээж байна..." : "Үнийн санал хүсэх"} <ArrowUpRight size={17} /></button>
            {quoteSubmitError && <p className="quote-status-message">{quoteSubmitError}</p>}
          </div>
        )}
      </div>
    </section>
  );
}

/* =========================================
   MAIN APP
========================================= */

function App() {
  const [sent, setSent] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Бүгд");
  const [productSearch, setProductSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productWidth, setProductWidth] = useState(1);
  const [productHeight, setProductHeight] = useState(1);
  const [productQuantity, setProductQuantity] = useState(1);

  const openProductDetails = (product) => {
    setProductWidth(1);
    setProductHeight(1);
    setProductQuantity(1);
    setSelectedProduct({ ...product, ...productDescriptions[product.name] });
  };

  // Ангилал эсвэл хайлт өөрчлөгдөх бүрд эхний 10 бүтээгдэхүүнээс эхэлнэ.
  useEffect(() => {
    setVisibleCount(10);
  }, [activeCategory, productSearch]);

  const [quoteItems, setQuoteItems] = useState([]);
  const [installation, setInstallation] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    message: "",
  });

  const update = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const submit = (e) => {
    e.preventDefault();

    const body = encodeURIComponent(
      `Нэр: ${form.name}\nУтас: ${form.phone}\nДэлгэрэнгүй: ${form.message}`
    );

    const subject = encodeURIComponent("Үнийн санал авах хүсэлт");

    window.location.href =
      `mailto:info@led-mongolia.mn?subject=${subject}&body=${body}`;

    setSent(true);
  };

  // Бүтээгдэхүүнийг үнийн саналд нэмэх
  const addProductToQuote = (product) => {
    const isLed = product.category === "LED дэлгэц";
    const isModule = isLed && isAreaModule(product.name);
    const hasDimensions = isLed;
    setQuoteItems((previous) => [
      ...previous,
      {
        name: product.name,
        category: product.category,
        image: product.image,
        unit: isModule ? "м²" : (isLed ? "ш" : "ш"),
        measurement: isLed && !isModule ? "cabinet" : (isModule ? "area" : "piece"),
        ...(hasDimensions ? {
          width: Number(productWidth) || 0,
          height: Number(productHeight) || 0,
        } : {}),
        quantity: Math.max(1, Number(productQuantity) || 1),
      },
    ]);

    setSelectedProduct(null);

    window.setTimeout(() => {
      document.getElementById("quote")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  // Ангилал болон хайлтын үгээр бүтээгдэхүүн шүүх
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      activeCategory === "Бүгд" ||
      product.category === activeCategory;

    const searchText =
      `${product.name} ${product.category}`.toLowerCase();

    const matchesSearch = searchText.includes(
      productSearch.trim().toLowerCase()
    );

    return matchesCategory && matchesSearch;
  });

  const categoryCounts = categories.map((category) => ({
    name: category,
    count:
      category === "Бүгд"
        ? products.length
        : products.filter((product) => product.category === category).length,
  }));

  return (
    <>
      <Header />

      <main id="home">
        <EventSection />

        {/* PRODUCTS */}
        <section className="products section" id="products">
          <div className="section-head">
            <div>
              <div className="section-tag">02 — БҮТЭЭГДЭХҮҮН</div>
              <h2>
                Таны орон зайд
                <br />
                <span>тохирох бүтээгдэхүүнүүд</span>
              </h2>
            </div>

            <p>
              Манай мэргэжлийн баг таны шаардлагад нийцсэн тоног төхөөрөмжийн
              шийдлийг боловсруулж, нийлүүлэлт, угсралт, суурилуулалтыг
              хариуцан ажиллана. Бүтээгдэхүүн бүрт техникийн зөвлөгөө,
              чанарын баталгаатай үйлчилгээ санал болгоно.
            </p>
          </div>

          <div className="catalog-toolbar">
            <div className="catalog-heading">
              <div>
                <span className="catalog-overline">PRODUCT CATALOG</span>
                <h3>Бүх бүтээгдэхүүн</h3>
              </div>
              <span className="catalog-total">
                {filteredProducts.length} бүтээгдэхүүн
              </span>
            </div>

            <label className="product-search">
              <Search size={18} />
              <input
                type="search"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Бүтээгдэхүүн хайх..."
                aria-label="Бүтээгдэхүүн хайх"
              />
              {productSearch && (
                <button
                  type="button"
                  onClick={() => setProductSearch("")}
                  aria-label="Хайлтыг арилгах"
                >
                  <X size={16} />
                </button>
              )}
            </label>
          </div>

          <div className="catalog-layout">
            <aside className="catalog-sidebar">
              <div className="sidebar-title">
                <span>АНГИЛАЛ</span>
                <span className="sidebar-indicator" />
              </div>

              <div className="product-categories">
                {categoryCounts.map(({ name, count }) => (
                  <button
                    key={name}
                    type="button"
                    className={
                      activeCategory === name
                        ? "category-btn active"
                        : "category-btn"
                    }
                    onClick={() => setActiveCategory(name)}
                    aria-pressed={activeCategory === name}
                  >
                    <span>{name}</span>
                    <span className="category-count">{count}</span>
                  </button>
                ))}
              </div>

              <div className="catalog-help">
                <span className="help-icon"><Phone size={17} /></span>
                <b>Сонголт хийхэд тусалъя</b>
                <p>
                  Танд тохирох тоног төхөөрөмжийн талаар манай
                  мэргэжилтнээс зөвлөгөө аваарай.
                </p>
                <a href="#contact">
                  Холбогдох <ArrowUpRight size={14} />
                </a>
              </div>
            </aside>

            <div className="catalog-results">
              <div className="catalog-results-top">
                <span>
                  {activeCategory === "Бүгд" ? "Бүх ангилал" : activeCategory}
                </span>
                <span>
                  01 — {String(filteredProducts.length).padStart(2, "0")}
                </span>
              </div>

              {filteredProducts.length > 0 ? (
                <>
                  <div className="products-grid">
                    {(activeCategory === "Бүгд"
                      ? filteredProducts.slice(0, visibleCount)
                      : filteredProducts
                    ).map((product, index) => (
                    <article className="product-card" key={product.name}>
                      <div className="product-image">
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                        />
                        <span className="product-number">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="product-image-label">LED MONGOLIA</span>
                      </div>

                      <div className="product-info">
                        <span className="product-category">
                          {product.category}
                        </span>
                        <h3>{product.name}</h3>

                        <button
                          className="product-link product-detail-trigger"
                          type="button"
                          onClick={() => openProductDetails(product)}
                        >
                          Дэлгэрэнгүй мэдээлэл <ArrowUpRight size={15} />
                        </button>
                      </div>
                    </article>
                    ))}
                  </div>

                  {activeCategory === "Бүгд" &&
                    visibleCount < filteredProducts.length && (
                      <div className="products-load-more">
                        <button
                          type="button"
                          onClick={() =>
                            setVisibleCount((current) =>
                              Math.min(current + 10, filteredProducts.length)
                            )
                          }
                        >
                          Цааш харах
                          <span>
                            ({filteredProducts.length - visibleCount} үлдсэн)
                          </span>
                          <ArrowRight size={17} />
                        </button>
                      </div>
                    )}
                </>
              ) : (
                <div className="catalog-empty">
                  <Search size={28} />
                  <h3>Бүтээгдэхүүн олдсонгүй</h3>
                  <p>Хайлтын үг эсвэл сонгосон ангиллаа өөрчлөөд үзнэ үү.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setProductSearch("");
                      setActiveCategory("Бүгд");
                    }}
                  >
                    Бүх бүтээгдэхүүн харах
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* PRODUCT MODAL */}
        {selectedProduct && (
          <div
            className="product-modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setSelectedProduct(null);
              }
            }}
          >
            <section
              className={`product-modal${selectedProduct.category === "LED дэлгэц" && showsDiagram(selectedProduct.name) && Number(productWidth) > 0 && Number(productHeight) > 0 ? " has-diagram" : ""}`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="product-modal-title"
            >
              <button
                className="product-modal-close"
                type="button"
                aria-label="Хаах"
                onClick={() => setSelectedProduct(null)}
              >
                <X size={21} />
              </button>

              <div className="product-modal-image">
                {selectedProduct.spin ? (
                  <Product360
                    dir={selectedProduct.spin.dir}
                    count={selectedProduct.spin.count}
                    alt={selectedProduct.name}
                  />
                ) : selectedProduct.model ? (
                  <model-viewer
                    src={selectedProduct.model}
                    poster={selectedProduct.image}
                    alt={selectedProduct.name}
                    camera-controls=""
                    auto-rotate=""
                    shadow-intensity="1"
                    style={{ width: "100%", height: "420px", background: "transparent" }}
                  />
                ) : (
                  <img src={selectedProduct.image} alt={selectedProduct.name} decoding="async" />
                )}
              </div>

              <div className="product-modal-content">
                <span className="product-category">
                  {selectedProduct.category}
                </span>
                <span className="product-modal-kicker">
                  PRODUCT DETAILS / LED MONGOLIA
                </span>
                <h2 id="product-modal-title">{selectedProduct.name}</h2>

                <p className="product-modal-description">
                  {selectedProduct.description ||
                    `${selectedProduct.name} нь ${selectedProduct.category.toLowerCase()} ангиллын тоног төхөөрөмж бөгөөд арга хэмжээ, суурилуулалт болон мэргэжлийн хэрэглээнд зориулсан сонголт юм. Таны төслийн хэрэгцээнд нийцүүлэн тохирох шийдлийг манай баг зөвлөж өгнө.`}
                </p>

                <div className="product-detail-list">
                  <div>
                    <span>АНГИЛАЛ</span>
                    <b>{selectedProduct.category}</b>
                  </div>

                  <div>
                    <span>ДЭЛГЭРЭНГҮЙ ТАЙЛБАР</span>
                    <b>
                      {selectedProduct.description ||
                        `${selectedProduct.name} нь ${selectedProduct.category} ангиллын мэргэжлийн тоног төхөөрөмж юм.`}
                    </b>
                  </div>

                  <div>
                    <span>АШИГЛАХ ЗОРИУЛАЛТ</span>
                    <b>
                      {selectedProduct.usage ||
                        "Тайз, эвент болон мэргэжлийн тоног төхөөрөмжийн хэрэглээ."}
                    </b>
                  </div>

                  <div>
                    <span>ТЕХНИКИЙН ОНЦЛОГ</span>
                    <b>
                      {selectedProduct.feature ||
                        "Техникийн үзүүлэлтийг үйлдвэрлэгчийн мэдээллээр баталгаажуулна."}
                    </b>
                  </div>
                </div>

                <div className="product-quote-inputs">
                  {selectedProduct.category === "LED дэлгэц" ? (
                    <>
                      <label>Өргөн (метр)
                        <input type="number" min="0.1" step="0.1" value={productWidth} onChange={(e) => setProductWidth(e.target.value)} />
                      </label>
                      <label>Өндөр (метр)
                        <input type="number" min="0.1" step="0.1" value={productHeight} onChange={(e) => setProductHeight(e.target.value)} />
                      </label>
                      <label>Ижил дэлгэцийн тоо
                        <input type="number" min="1" step="1" value={productQuantity} onChange={(e) => setProductQuantity(e.target.value)} />
                      </label>
                      {isAreaModule(selectedProduct.name) ? (
                        <p className="product-auto-count">Тооцох хэмжээ: <b>{((Number(productWidth) || 0) * (Number(productHeight) || 0) * (Number(productQuantity) || 0)).toFixed(2)} м²</b></p>
                      ) : (
                        <p className="product-auto-count">50 × 50 см cabinet: <b>{Math.ceil((Number(productWidth) || 0) / 0.5) * Math.ceil((Number(productHeight) || 0) / 0.5) * (Number(productQuantity) || 0)} ширхэг</b></p>
                      )}
                    </>
                  ) : (
                    <label>Тоо ширхэг
                      <input type="number" min="1" step="1" value={productQuantity} onChange={(e) => setProductQuantity(e.target.value)} />
                    </label>
                  )}
                </div>
                <div className="product-modal-actions">
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => addProductToQuote(selectedProduct)}
                    disabled={selectedProduct.category === "LED дэлгэц"
                      ? !(Number(productWidth) > 0 && Number(productHeight) > 0 && Number(productQuantity) > 0)
                      : !(Number(productQuantity) > 0)}
                  >
                    Үнийн санал авах <ArrowUpRight size={17} />
                  </button>

                  <button
                    type="button"
                    className="product-modal-back"
                    onClick={() => setSelectedProduct(null)}
                  >
                    Буцах
                  </button>
                </div>
              </div>

              {selectedProduct.category === "LED дэлгэц" && showsDiagram(selectedProduct.name) && Number(productWidth) > 0 && Number(productHeight) > 0 && (
                <aside className="product-modal-diagram">
                  <LedDiagramPanel
                    width={productWidth}
                    height={productHeight}
                    quantity={productQuantity}
                    measurement={isAreaModule(selectedProduct.name) ? "area" : "cabinet"}
                    curved={isCurved(selectedProduct.name)}
                    cube={isCube(selectedProduct.name)}
                  />
                </aside>
              )}
            </section>
          </div>
        )}

        {/* QUOTE CALCULATOR */}
        <QuoteSection
          items={quoteItems}
          setItems={setQuoteItems}
          installation={installation}
          setInstallation={setInstallation}
          products={products}
        />

        {/* ABOUT */}
        <section className="intro section" id="about">
          <div className="section-tag">01 — БИДНИЙ ТУХАЙ</div>

          <div className="intro-content">
            <h2>
              20 жилийн туршлага.
              <br />
              <span>Нэг дор цогц шийдэл.</span>
            </h2>

            <div>
              <p>
                Та олон брэндийн нээлт, хурал, форум, энтертайнмент
                эвент, шоу тоглолтын гайхалтай уур амьсгал,
                мэргэжлийн зохион байгуулалттай олонтаа таарч байсан
                байх. Тэдгээр арга хэмжээний ард дуу, гэрэл, LED
                дэлгэц, тайзны тоног төхөөрөмжийг нэгтгэсэн цогц
                шийдэл, туршлагатай мэргэжлийн баг ажиллаж байдаг.

                Бид 20 жилийн турш хуримтлуулсан туршлага, орчин
                үеийн техник технологи, чанартай тоног төхөөрөмж,
                бүтээлч сэтгэлгээндээ тулгуурлан хэрэглэгч бүрийн
                хэрэгцээ, төсөл, арга хэмжээнд тохирсон шийдлийг
                санал болгодог. Тоног төхөөрөмжийн худалдаа,
                түрээсээс эхлээд угсралт, суурилуулалт, засвар
                үйлчилгээ хүртэлх бүх үйлчилгээг нэг дороос хүргэнэ.
              </p>

              <a className="under-link" href="#contact">
                Бидэнтэй холбогдох
                <ArrowUpRight size={17} />
              </a>
            </div>
          </div>

          <div className="stats">
            <div>
              <strong>360°</strong>
              <span>Цогц шийдэл</span>
            </div>
            <div>
              <strong>HD+</strong>
              <span>Тод дүрсний сонголт</span>
            </div>
            <div>
              <strong>24/7</strong>
              <span>Төслийн дэмжлэг</span>
            </div>
            <div>
              <strong>01</strong>
              <span>Нэг цэгийн үйлчилгээ</span>
            </div>
          </div>
        </section>

        {/* SERVICES */}
        <section className="services section" id="services">
          <div className="services-top">
            <div>
              <div className="section-tag">03 — ҮЙЛЧИЛГЭЭ</div>
              <h2>
                Эхлэлээс нь эцэс хүртэл.
                <br />
              </h2>
            </div>
          </div>

          <div className="service-list">
            {services.map((service, index) => {
              const Icon = service.icon;

              return (
                <div className="service-row" key={service.title}>
                  <span className="service-index">0{index + 1}</span>
                  <div className="service-icon"><Icon size={23} /></div>
                  <h3>{service.title}</h3>
                  <p>{service.text}</p>
                  <ArrowUpRight className="service-arrow" />
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="cta-band">
          <div className="cta-orb" />
          <div className="section-tag">LET'S BUILD SOMETHING BRIGHT</div>

          <h2>
            Таны дараагийн төсөл
            <br />
            <span>эндээс эхэлнэ.</span>
          </h2>

          <a className="btn btn-white" href="#quote">
            Үнийн санал авах
            <ArrowRight size={18} />
          </a>
        </section>

        {/* CONTACT */}
        <section className="contact section" id="contact">
          <div className="contact-left">
            <div className="section-tag">04 — ХОЛБОО БАРИХ</div>

            <h2>
              Санаагаа
              <br />
              <span>ярилцъя.</span>
            </h2>

            <p>
              Төслийнхөө талаар бидэнд мэдээлэл үлдээгээрэй.
              Бид тантай холбогдоно.
            </p>

            <a className="contact-line" href="tel:94070164">
              <span className="contact-icon"><Phone size={19} /></span>
              <span>
                <small>УТАС</small>
                <b>9407 0164</b>
              </span>
              <ArrowUpRight />
            </a>

            <a className="contact-line" href="mailto:info@led-mongolia.mn">
              <span className="contact-icon"><Mail size={19} /></span>
              <span>
                <small>И-МЭЙЛ</small>
                <b>info@led-mongolia.mn</b>
              </span>
              <ArrowUpRight />
            </a>

            <div className="contact-line">
              <span className="contact-icon"><MapPin size={19} /></span>
              <span>
                <small>БАЙРШИЛ</small>
                <b>Улаанбаатар, Монгол</b>
              </span>
            </div>
          </div>

          <form className="contact-form" onSubmit={submit}>
            <div className="form-title">
              Хүсэлт илгээх
              <span>Бид тантай эргэн холбогдоно.</span>
            </div>

            <label>
              Таны нэр
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={update}
                placeholder="Нэрээ бичнэ үү"
                required
              />
            </label>

            <label>
              Утасны дугаар
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={update}
                placeholder="Утасны дугаар"
                required
              />
            </label>

            <label>
              Нэмэлт мэдээлэл
              <textarea
                name="message"
                value={form.message}
                onChange={update}
                placeholder="Төслийнхөө талаар товч бичнэ үү..."
                rows={3}
              />
            </label>

            <button className="btn btn-primary form-submit" type="submit">
              Хүсэлт илгээх
              <ArrowRight size={18} />
            </button>

            {sent && (
              <p className="form-note">
                Имэйл илгээх цонх нээгдлээ. Хүсэлтээ илгээж баталгаажуулна уу.
              </p>
            )}

            <p className="form-note">
              Илгээх товчийг дарахад таны имэйл програм нээгдэнэ.
            </p>
          </form>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <a className="brand" href="#home" aria-label="LED Mongolia нүүр хуудас">
          <img className="brand-logo" src={logo} alt="LED Mongolia — Visual Technology" />
        </a>

        <span>
          © {new Date().getFullYear()} LED Mongolia.
          Бүх эрх хуулиар хамгаалагдсан.
        </span>

        <a href="#home" className="back-top">
          ДЭЭШ БУЦАХ ↑
        </a>
      </footer>
    </>
  );
}

export default App;