export const MEDICAL_KNOWLEDGE = [
  {
    id: 'red-flags-emergency',
    content:
      'Dấu hiệu cấp cứu cần đến viện ngay (không tự theo dõi tại nhà): đau ngực lan tay/hàm kèm vã mồ hôi khó thở; đột ngột yếu/liệt nửa người, méo miệng, nói khó; khó thở nặng SpO2 <92%; sốt cao kèm cứng cổ lơ mơ; nôn ra máu / đi ngoài phân đen lượng nhiều; phản ứng dị ứng phù mặt-họng; ý nghĩ tự hại. Gọi cấp cứu 115.',
    keywords: ['cấp cứu', '115', 'nguy hiểm', 'cấp cứu ngay', 'emergency'],
  },
  {
    id: 'stroke-fast',
    content:
      'Đột quỵ — nhớ FAST: Face (méo miệng), Arm (yếu tay), Speech (nói khó/đớ), Time (thời gian vàng). Kèm đột ngột đau đầu dữ dội, nhìn mờ một bên, mất thăng bằng. Cần cấp cứu ngay, không cho ăn/uống, ghi giờ khởi phát.',
    keywords: ['đột quỵ', 'liệt', 'méo miệng', 'nói khó', 'stroke', 'fast'],
  },
  {
    id: 'headache',
    content:
      'Đau đầu thường gặp do căng thẳng, thiếu ngủ, mất nước, migraine. Theo dõi tại nhà nếu đau tăng dần, đáp ứng nghỉ và đủ nước. Cấp cứu nếu đau đầu dữ dội đột ngột “sấm sét”, kèm cứng cổ, sốt, yếu liệt, nhìn đôi, sau chấn thương đầu.',
    keywords: ['đau đầu', 'nhức đầu', 'headache', 'migraine'],
  },
  {
    id: 'chest-pain',
    content:
      'Đau ngực: nghĩ tim mạch khi đau/tức giữa ngực, lan tay trái vai hàm, kèm khó thở vã mồ hôi buồn nôn — cấp cứu. Đau tăng khi ấn, liên quan tư thế có thể cơ-xương. Không tự dùng nhiều NSAID nếu nghi ngờ tim. Chuyên khoa: Tim mạch / Cấp cứu.',
    keywords: ['đau ngực', 'tức ngực', 'chest pain', 'nhồi máu'],
  },
  {
    id: 'fever',
    content:
      'Sốt: uống đủ nước, hạ sốt paracetamol theo hướng dẫn trên bao bì nếu không chống chỉ định. Khám sớm nếu sốt >3 ngày, sốt >39°C khó hạ, phát ban, khó thở, lơ mơ, cổ cứng, tiểu buốt, hoặc trẻ nhỏ/người già/bệnh nền. Việt Nam cần nghĩ sốt xuất huyết khi sốt + đau cơ + xuất huyết dưới da.',
    keywords: ['sốt', 'fever', 'nóng', 'sốt xuất huyết', 'dengue'],
  },
  {
    id: 'dengue',
    content:
      'Sốt xuất huyết Dengue (phổ biến VN): sốt cao 2–7 ngày, đau cơ-khớp, đau sau hốc mắt, phát ban, xuất huyết chân răng/mũi. Nguy hiểm ngày 3–7 khi sốt hạ nhưng mệt, đau bụng, nôn, chân tay lạnh. Không dùng aspirin/ibuprofen (tăng chảy máu). Bù dịch, theo dõi tiểu cầu theo chỉ định bác sĩ.',
    keywords: ['sốt xuất huyết', 'dengue', 'muỗi', 'xuất huyết'],
  },
  {
    id: 'blood-pressure',
    content:
      'Huyết áp: tối ưu <120/80 mmHg. Tăng HA: ≥140/90 (đo đúng tư thế, nghỉ 5 phút, tay ngang tim). HA ≥180/120 kèm đau đầu dữ dội, tức ngực, khó thở, nhìn mờ — cấp cứu. Tự chăm sóc: giảm muối, vận động, không hút thuốc, uống thuốc đều nếu bác sĩ kê.',
    keywords: ['huyết áp', 'blood pressure', 'cao huyết áp', 'tăng huyết áp'],
  },
  {
    id: 'blood-sugar',
    content:
      'Đường huyết lúc đói: 70–99 mg/dL bình thường; 100–125 tiền ĐTĐ; ≥126 gợi ý đái tháo đường (cần xét nghiệm xác nhận). Hạ đường huyết <70: vã mồ hôi, run, đói, lú lẫn — uống 15g đường nhanh, đo lại sau 15 phút. Tăng rất cao kèm nôn, thở nhanh, lơ mơ — cấp cứu.',
    keywords: ['đường huyết', 'blood sugar', 'tiểu đường', 'đái tháo đường', 'hạ đường'],
  },
  {
    id: 'heart-rate',
    content:
      'Nhịp tim nghỉ người lớn khoảng 60–100 lần/phút. >120 kéo dài kèm choáng/đau ngực/khó thở cần khám. <50 kèm ngất, mệt lả — khám. Vận động làm nhịp tăng là sinh lý. Cà phê, sốt, thiếu nước, cường giáp cũng làm nhanh.',
    keywords: ['nhịp tim', 'tim đập', 'mạch', 'heart rate', 'nhịp nhanh'],
  },
  {
    id: 'spo2-temp',
    content:
      'SpO2 bình thường ≥95% (không oxy). 92–94% cần đánh giá; <92% hoặc tím môi khó thở — cấp cứu. Nhiệt độ: 36.1–37.2°C; ≥38°C là sốt. Đo SpO2 sai nếu tay lạnh, sơn móng, chuyển động.',
    keywords: ['spo2', 'oxy', 'nồng độ oxy', 'nhiệt độ', 'thân nhiệt'],
  },
  {
    id: 'abdominal-pain',
    content:
      'Đau bụng: ăn uống, đầy hơi thường nhẹ. Cấp cứu nếu đau dữ dội khu trú (đặc biệt hố chậu phải), bụng cứng, sốt, nôn liên tục, máu trong phân/nôn, không trung tiện, thai hoặc nghi thai. Không dùng giảm đau mạnh trước khi khám cấp cứu.',
    keywords: ['đau bụng', 'bụng', 'ruột thừa', 'abdominal'],
  },
  {
    id: 'diarrhea-vomit',
    content:
      'Tiêu chảy/nôn: bù nước oresol từng ngụm, ăn nhạt. Khám nếu máu, sốt cao, dấu mất nước (khát, ít tiểu, chóng mặt), tiêu chảy >2 ngày, trẻ nhỏ/người già. Không tự dùng kháng sinh trừ khi bác sĩ chỉ định. Rửa tay, thức ăn chín.',
    keywords: ['tiêu chảy', 'nôn', 'ói', 'đi ngoài', 'tiêu hóa'],
  },
  {
    id: 'cough',
    content:
      'Ho cấp thường do virus: nghỉ, ẩm không khí, mật ong (người lớn). Khám nếu ho >3 tuần, ho ra máu, khó thở, sốt kéo, sụt cân, hoặc bệnh phổi/tim. Kháng sinh không trị cảm virus.',
    keywords: ['ho', 'cough', 'khó thở', 'họng', 'viêm phổi'],
  },
  {
    id: 'asthma',
    content:
      'Hen/COPD: khó thở khò khè, tức ngực. Cơn nặng: nói không hết câu, môi tím, không đáp ứng thuốc xịt — cấp cứu. Không tự ngưng corticosteroid hít. Tránh khói, bụi, cảm lạnh.',
    keywords: ['hen', 'khò khè', 'copd', 'suyễn', 'asthma'],
  },
  {
    id: 'dizziness',
    content:
      'Chóng mặt: thiếu nước, HA thấp, thiếu máu, rối loạn tiền đình. Nằm, uống nước, đứng dậy từ từ. Cấp cứu nếu kèm yếu liệt, nói khó, đau đầu sấm sét, nhìn đôi, đau ngực, ngất.',
    keywords: ['chóng mặt', 'hoa mắt', 'dizziness', 'vertigo', 'ngất'],
  },
  {
    id: 'fatigue',
    content:
      'Mệt mỏi: thiếu ngủ, stress, thiếu máu, suy giáp, trầm cảm, bệnh mạn. Khám nếu mệt >2–4 tuần kèm sốt, sụt cân, khó thở, phân đen, hoặc không cải thiện khi nghỉ.',
    keywords: ['mệt', 'mệt mỏi', 'fatigue', 'kiệt sức', 'thiếu máu'],
  },
  {
    id: 'insomnia',
    content:
      'Vệ sinh giấc ngủ: giờ cố định, tắt màn hình 1 giờ trước ngủ, hạn chế caffeine sau 14h, không nằm quá lâu trên giường khi không ngủ được. Mất ngủ >1 tháng hoặc buồn ngủ ban ngày ảnh hưởng việc — khám. Không tự dùng thuốc ngủ kéo dài.',
    keywords: ['mất ngủ', 'insomnia', 'khó ngủ', 'ngủ'],
  },
  {
    id: 'back-pain',
    content:
      'Đau lưng cơ học: chườm ấm, vận động nhẹ, tránh nâng lệch. Cấp cứu/khám gấp: yếu chân, tê yên ngựa, bí/son tiểu, sốt, sụt cân, tiền sử ung thư, chấn thương mạnh.',
    keywords: ['đau lưng', 'lưng', 'cột sống', 'back pain', 'thoát vị'],
  },
  {
    id: 'uti',
    content:
      'Viêm đường tiểu: tiểu buốt, tiểu dắt, đau hạ vị. Uống nhiều nước. Khám nếu sốt, đau hông lưng, nôn, máu đại thể, thai kỳ, nam giới, tái phát. Không tự kháng sinh khi chưa được chỉ định.',
    keywords: ['tiểu buốt', 'đường tiểu', 'uti', 'bàng quang', 'tiểu dắt'],
  },
  {
    id: 'allergy',
    content:
      'Dị ứng nhẹ: mẩn ngứa, có thể kháng histamine không kê đơn theo hướng dẫn. Phản vệ: khó thở, khàn, phù mặt-môi-lưỡi, tụt HA, choáng — tiêm adrenaline nếu có bút, gọi 115. Ghi nhận dị ứng vào hồ sơ HealthGuard.',
    keywords: ['dị ứng', 'mẩn', 'phù', 'phản vệ', 'allergy', 'sẩn'],
  },
  {
    id: 'wound-infection',
    content:
      'Vết thương: rửa nước sạch/xà phòng, băng. Dấu nhiễm: đỏ lan, nóng, mủ, sốt, sưng đau tăng. Uốn ván nếu vết bẩn/đâm — kiểm tra tiêm chủng. Vết sâu, máu phun, dị vật — cơ sở y tế.',
    keywords: ['vết thương', 'nhiễm trùng', 'mủ', 'rách', 'uốn ván'],
  },
  {
    id: 'weight',
    content:
      'BMI 18.5–24.9 bình thường. Sụt >5% cân trong 6 tháng không chủ đích cần khám. Tăng cân nhanh + phù chân nghĩ tim/thận/thuốc. Giảm cân lành mạnh: thâm hụt calo vừa, protein đủ, không nhịn đói cực đoan.',
    keywords: ['cân nặng', 'weight', 'bmi', 'sụt cân', 'béo phì'],
  },
  {
    id: 'medication-adherence',
    content:
      'Bệnh mạn (HA, ĐTĐ, hen): uống đúng giờ, không tự ngưng khi “thấy khỏe”. Báo bác sĩ tác dụng phụ. Tương tác: grapefruit, rượu với một số thuốc. HealthGuard chỉ nhắc lịch — không thay đơn thuốc.',
    keywords: ['thuốc', 'uống thuốc', 'medication', 'liều', 'tuân thủ'],
  },
  {
    id: 'nsaid-safety',
    content:
      'Paracetamol: giảm đau/hạ sốt, không uống quá liều ghi trên bao (tổn thương gan), tránh rượu nhiều. NSAID (ibuprofen): có thể đau dạ dày, tăng HA, hại thận; tránh nếu loét, suy thận, đang chống đông, nghi đau tim. Không khuyên aspirin trẻ em (hội chứng Reye).',
    keywords: ['paracetamol', 'ibuprofen', 'aspirin', 'giảm đau', 'hạ sốt', 'nsaid'],
  },
  {
    id: 'no-antibiotic-virus',
    content:
      'Kháng sinh không có tác dụng với cảm, cúm, đa số viêm họng virus. Dùng bừa làm kháng thuốc và tác dụng phụ. Chỉ dùng khi bác sĩ chẩn đoán nhiễm khuẩn và kê đơn.',
    keywords: ['kháng sinh', 'antibiotic', 'cảm cúm', 'viêm họng'],
  },
  {
    id: 'mental-health',
    content:
      'Lo âu trầm cảm: ngủ kém, mất thích thú, mệt, tự ti kéo dài 2 tuần nên gặp bác sĩ/tâm lý. Cấp cứu tâm thần: ý định tự hại, kế hoạch, ảo giác. Lắng nghe, không phán xét, hỗ trợ đến cơ sở y tế. Tổng đài hỗ trợ khủng hoảng nếu có tại địa phương.',
    keywords: ['trầm cảm', 'lo âu', 'stress', 'tự tử', 'tâm thần'],
  },
  {
    id: 'hydration',
    content:
      'Người lớn uống khoảng 1.5–2.5 lít/ngày tùy khí hậu vận động. Mất nước: khát, môi khô, ít tiểu, chóng mặt đứng. Bù oresol khi tiêu chảy. Người suy tim/thận hạn chế dịch theo bác sĩ.',
    keywords: ['nước', 'mất nước', 'oresol', 'uống nước', 'dehydrat'],
  },
  {
    id: 'exercise',
    content:
      'Vận động: 150 phút/tuần cường độ vừa (đi bộ nhanh) nếu bác sĩ không chống chỉ định. Ngừng và khám nếu đau ngực, ngất, khó thở bất thường khi tập. Khởi động, tăng dần, không tập khi sốt.',
    keywords: ['tập thể dục', 'vận động', 'đi bộ', 'exercise'],
  },
  {
    id: 'salt-diet',
    content:
      'Giảm muối (<5g/ngày) giúp huyết áp. Hạn chế đồ hộp, mắm, snack. Tăng rau, chất xơ, hạn chế đường ngọt uống. ĐTĐ: không bỏ bữa, cân carbohydrate. Đây là hướng dẫn chung, thực đơn bệnh lý do bác sĩ/dinh dưỡng.',
    keywords: ['muối', 'ăn', 'dinh dưỡng', 'chế độ ăn', 'đường'],
  },
  {
    id: 'alcohol-tobacco',
    content:
      'Thuốc lá hại tim mạch, phổi, ung thư — cai càng sớm càng tốt. Rượu: không có ngưỡng an toàn cho mọi người; không lái xe sau uống. Cai rượu đột ngột nếu nghiện nặng có thể nguy hiểm — cần hỗ trợ y tế.',
    keywords: ['rượu', 'thuốc lá', 'hút thuốc', 'cai thuốc', 'gan'],
  },
  {
    id: 'specialty-general',
    content:
      'Gợi ý chuyên khoa (tham khảo): Cấp cứu (dấu hiệu đỏ); Tim mạch (đau ngực, HA, hồi hộp); Nội tiết (ĐTĐ, tuyến giáp); Thần kinh (đau đầu mạn, yếu liệt); Tiêu hóa (đau bụng, trào ngược); Hô hấp (hen, ho kéo); Da liễu (ban, dị ứng da); Tâm thần/tâm lý (trầm cảm lo âu); Đa khoa/nội tổng quát khi chưa rõ.',
    keywords: ['chuyên khoa', 'khám', 'bác sĩ', 'khoa'],
  },
  {
    id: 'pregnancy-refer',
    content:
      'Thai kỳ: không tự dùng thuốc (kể cả thảo dược) khi chưa hỏi bác sĩ. Đau bụng, chảy máu, phù nhanh, đau đầu dữ + nhìn mờ, giảm cử động thai — khám ngay. HealthGuard không theo dõi sản khoa chuyên sâu.',
    keywords: ['mang thai', 'thai', 'bà bầu', 'pregnancy'],
  },
  {
    id: 'gi-bleed',
    content:
      'Xuất huyết tiêu hóa: nôn ra máu, nôn bã cà phê, phân đen nhão, đi ngoài ra máu lượng nhiều — cấp cứu. Không NSAID, không ăn uống nếu choáng. Phân biệt trĩ (máu đỏ tươi cuối bãi, không choáng) vẫn nên khám nếu tái phát.',
    keywords: ['nôn ra máu', 'phân đen', 'xuất huyết', 'tiêu hóa', 'gi bleed'],
  },
  {
    id: 'seizure-syncope',
    content:
      'Co giật: để nằm nghiêng an toàn, không nhét gì vào miệng, ghi thời gian cơn. Cơn >5 phút, tái liên tiếp, hoặc lần đầu — cấp cứu. Ngất kèm đau ngực, khó thở, hồi hộp, thần kinh khu trú — nghĩ tim/đột quỵ, gọi 115.',
    keywords: ['co giật', 'động kinh', 'ngất', 'mất ý thức', 'seizure'],
  },
  {
    id: 'cold-flu',
    content:
      'Cảm/cúm: sốt, sổ mũi, đau họng, đau mỏi — nghỉ, nước, hạ sốt nếu cần. Khám nếu khó thở, đau ngực, lú lẫn, sốt cao kéo, hoặc nhóm nguy cơ (già, bệnh nền, mang thai). Khẩu trang, rửa tay khi mùa dịch.',
    keywords: ['cảm', 'cúm', 'sổ mũi', 'viêm họng', 'covid'],
  },
  {
    id: 'gerd',
    content:
      'Trào ngược/đau thượng vị: ăn chậm, không nằm ngay sau ăn, hạn chế chua cay cà phê đêm. Ợ chua kéo, nuốt nghẹn, sụt cân, nôn ra máu — khám tiêu hóa. Phân biệt đau thượng vị với đau ngực tim mạch nếu có yếu tố nguy cơ.',
    keywords: ['trào ngược', 'ợ chua', 'dạ dày', 'gerd', 'thượng vị'],
  },
  {
    id: 'kidney-edema',
    content:
      'Phù chân, tiểu ít, nước tiểu sủi bọt, HA tăng: nghĩ thận — khám. Đau hông lưng + sốt + tiểu buốt: viêm đài bể thận, cần khám sớm. Không lạm dụng NSAID.',
    keywords: ['thận', 'phù', 'tiểu ít', 'sỏi thận'],
  },
];
