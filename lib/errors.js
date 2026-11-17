// Backend xato matnlari (o'zbekcha) -> [ru, en] tarjimalari.
const ERRORS = {
  "Bu o'quvchi shu sana va shu turda allaqachon baholangan. Bahoni o'zgartirib bo'lmaydi": ["Этот ученик уже оценён на эту дату и этого типа. Оценку изменить нельзя", "This pupil has already been graded for this date and type. The grade cannot be changed"],
  "Bu dars uchun davomat allaqachon saqlangan. Uni o'zgartirib bo'lmaydi": ["Посещаемость на этот урок уже сохранена. Изменить её нельзя", "Attendance for this lesson has already been saved. It cannot be changed"],
  "Bu ish allaqachon baholangan. Bahoni o'zgartirib bo'lmaydi": ["Эта работа уже оценена. Оценку изменить нельзя", "This submission has already been graded. The grade cannot be changed"],
  "Sarlavha uch tilda (uz, ru, en) kiritilishi kerak": ["Заголовок нужно ввести на трёх языках (uz, ru, en)", "The title must be entered in three languages (uz, ru, en)"],
  "Matn uch tilda (uz, ru, en) kiritilishi kerak": ["Текст нужно ввести на трёх языках (uz, ru, en)", "The text must be entered in three languages (uz, ru, en)"],
  "Admin parolini bu yerdan yangilab bo'lmaydi": ["Пароль администратора нельзя обновить здесь", "Administrator password cannot be reset here"],
  "Login yoki parol noto'g'ri": ["Неверный логин или пароль", "Incorrect login or password"],
  "Profilingiz faolsizlantirilgan. Administratorga murojaat qiling": ["Ваш профиль деактивирован. Обратитесь к администратору", "Your profile is deactivated. Contact the administrator"],
  "Profil faolsizlantirilgan": ["Профиль деактивирован", "Profile is deactivated"],
  "Token noto'g'ri yoki muddati tugagan": ["Сессия истекла. Войдите снова", "Session expired. Please sign in again"],
  "Sizda bu amalni bajarish uchun ruxsat yo'q": ["У вас нет прав для этого действия", "You do not have permission for this action"],
  "Admin loginini bu yerdan yangilab bo'lmaydi": ["Логин администратора нельзя обновить здесь", "Administrator login cannot be reset here"],
  "Adminni faolsizlantirib bo'lmaydi": ["Администратора нельзя деактивировать", "Administrator cannot be deactivated"],
  "O'zingizni faolsizlantira olmaysiz": ["Нельзя деактивировать самого себя", "You cannot deactivate yourself"],
  "Foydalanuvchi topilmadi": ["Пользователь не найден", "User not found"],
  "Login yaratib bo'lmadi, qayta urinib ko'ring": ["Не удалось создать логин, повторите попытку", "Could not generate a login, please try again"],
  "Faqat o'quvchini guruhga qo'shish mumkin": ["В класс можно добавить только ученика", "Only pupils can be added to a class"],
  "Guruh topilmadi": ["Класс не найден", "Class not found"],
  "Guruh faol emas": ["Класс неактивен", "Class is inactive"],
  "Bunday guruh allaqachon mavjud": ["Такой класс уже существует", "This class already exists"],
  "Bunday fan allaqachon mavjud": ["Такой предмет уже существует", "This subject already exists"],
  "Fan topilmadi": ["Предмет не найден", "Subject not found"],
  "Fan guruh, o'qituvchi yoki boshqa ma'lumotlarga bog'langan, o'chirib bo'lmaydi": ["Предмет связан с классами, учителями или другими данными и не может быть удалён", "The subject is linked to classes, teachers or other data and cannot be deleted"],
  "Guruhga o'quvchi, fan yoki dars jadvali bog'langan. O'chirish o'rniga faolsizlantiring": ["К классу привязаны ученики, предметы или расписание. Вместо удаления деактивируйте его", "The class has pupils, subjects or a schedule. Deactivate it instead of deleting"],
  "O'quvchi topilmadi": ["Ученик не найден", "Pupil not found"],
  "O'quvchi bu guruhda emas": ["Ученик не состоит в этом классе", "The pupil is not in this class"],
  "O'quvchini guruhga qo'shib bo'lmadi": ["Не удалось добавить ученика в класс", "Could not add the pupil to the class"],
  "Fan bu guruhga allaqachon biriktirilgan": ["Предмет уже привязан к этому классу", "The subject is already assigned to this class"],
  "Fan bu o'qituvchiga allaqachon biriktirilgan": ["Предмет уже привязан к этому учителю", "The subject is already assigned to this teacher"],
  "Bunday biriktirish topilmadi": ["Такая привязка не найдена", "Assignment not found"],
  "Avval bu fan bo'yicha o'qituvchi tayinlashni va dars jadvalini o'chiring": ["Сначала удалите назначение учителя и расписание по этому предмету", "First remove the teacher assignment and schedule for this subject"],
  "Avval bu fan bo'yicha dars jadvalini o'chiring": ["Сначала удалите расписание по этому предмету", "First remove the schedule for this subject"],
  "O'qituvchi bu fanni guruhlarda o'tmoqda. Avval tayinlashni o'chiring": ["Учитель ведёт этот предмет в классах. Сначала удалите назначения", "The teacher teaches this subject in classes. Remove the assignments first"],
  "O'qituvchi topilmadi": ["Учитель не найден", "Teacher not found"],
  "O'qituvchi faol emas": ["Учитель неактивен", "Teacher is inactive"],
  "Tayinlangan o'qituvchi faol emas": ["Назначенный учитель неактивен", "The assigned teacher is inactive"],
  "Bu fan avval guruhga biriktirilishi kerak": ["Сначала привяжите предмет к классу", "Assign the subject to the class first"],
  "Bu fan avval o'qituvchiga biriktirilishi kerak": ["Сначала привяжите предмет к учителю", "Assign the subject to the teacher first"],
  "Yangi o'qituvchining boshqa darsi shu vaqtga to'g'ri keladi": ["У нового учителя в это время другой урок", "The new teacher has another lesson at this time"],
  "Tayinlash topilmadi": ["Назначение не найдено", "Assignment not found"],
  "Bu fan guruhga biriktirilmagan": ["Предмет не привязан к классу", "The subject is not assigned to this class"],
  "Bu fan uchun guruhga o'qituvchi tayinlanmagan": ["Для этого предмета в классе не назначен учитель", "No teacher is assigned to this subject in the class"],
  "Guruhning bu vaqtda boshqa darsi bor": ["У класса в это время уже есть урок", "The class already has a lesson at this time"],
  "O'qituvchining bu vaqtda boshqa darsi bor": ["У учителя в это время уже есть урок", "The teacher already has a lesson at this time"],
  "Jadval topilmadi": ["Расписание не найдено", "Schedule not found"],
  "Dars topilmadi": ["Урок не найден", "Lesson not found"],
  "Bu darsga davomat yozilgan, o'chirib bo'lmaydi": ["На этот урок записана посещаемость, удалить нельзя", "Attendance is recorded for this lesson, it cannot be deleted"],
  "Tugash vaqti boshlanish vaqtidan keyin bo'lishi kerak": ["Время окончания должно быть позже начала", "End time must be after the start time"],
  "Kelajak sanasiga davomat qilib bo'lmaydi": ["Нельзя отмечать посещаемость на будущую дату", "Attendance cannot be marked for a future date"],
  "Bu sana dars jadvalidagi hafta kuniga mos kelmaydi": ["Эта дата не совпадает с днём недели в расписании", "This date does not match the weekday in the schedule"],
  "Bir o'quvchi ikki marta kiritilgan": ["Один ученик указан дважды", "A pupil is listed twice"],
  "Ro'yxatda bu guruhga tegishli bo'lmagan o'quvchi bor": ["В списке есть ученик не из этого класса", "The list contains a pupil who is not in this class"],
  "O'quvchi topilmadi yoki guruhga biriktirilmagan": ["Ученик не найден или не состоит в классе", "Pupil not found or not in a class"],
  "Siz bu o'quvchiga bu fandan dars bermaysiz": ["Вы не преподаёте этот предмет этому ученику", "You do not teach this subject to this pupil"],
  "Kelajak sanasiga baho qo'yib bo'lmaydi": ["Нельзя ставить оценку на будущую дату", "Grades cannot be set for a future date"],
  "Baho topilmadi": ["Оценка не найдена", "Grade not found"],
  "Siz bu guruhda bu fandan dars bermaysiz": ["Вы не преподаёте этот предмет в этом классе", "You do not teach this subject in this class"],
  "Siz bu guruhga dars bermaysiz": ["Вы не преподаёте в этом классе", "You do not teach this class"],
  "Uy vazifasi topilmadi": ["Задание не найдено", "Homework not found"],
  "Vazifaga javoblar yuklangan, o'chirib bo'lmaydi": ["К заданию загружены ответы, удалить нельзя", "Submissions exist for this homework, it cannot be deleted"],
  "Tugash muddati boshlanish vaqtidan keyin bo'lishi kerak": ["Срок сдачи должен быть позже начала", "Deadline must be after the start time"],
  "Vazifa topshirish hali boshlanmagan": ["Приём работ ещё не начался", "Submission has not started yet"],
  "Vazifa topshirish muddati tugagan": ["Срок сдачи истёк", "The submission deadline has passed"],
  "Baholangan vazifani o'zgartirib bo'lmaydi": ["Оценённое задание нельзя изменить", "A graded submission cannot be changed"],
  "Javob topilmadi": ["Ответ не найден", "Submission not found"],
  "Fayl yoki matnli javob kiritilishi kerak": ["Нужно загрузить файл или написать ответ", "Upload a file or write an answer"],
  "Bu fan sizga biriktirilmagan": ["Этот предмет вам не назначен", "This subject is not assigned to you"],
  "Bu fan sizning guruhingizga biriktirilmagan": ["Этот предмет не назначен вашему классу", "This subject is not assigned to your class"],
  "Material topilmadi": ["Материал не найден", "Material not found"],
  "Fayl turidagi material uchun fayl kerak": ["Для материала-файла нужно загрузить файл", "A file material requires an uploaded file"],
  "Fayl turidagi material uchun fayl yuklash kerak": ["Для материала-файла нужно загрузить файл", "A file material requires an uploaded file"],
  "Matn yoki havola kiritilishi kerak": ["Введите текст или ссылку", "Enter text or a link"],
  "Fayl topilmadi": ["Файл не найден", "File not found"],
  "Fayl topilmadi. Avval faylni qayta yuklang": ["Файл не найден. Загрузите файл заново", "File not found. Please upload it again"],
  "Fayl serverdan topilmadi": ["Файл не найден на сервере", "File was not found on the server"],
  "Fayl bo'sh": ["Файл пустой", "The file is empty"],
  "Admin faqat teacher yoki pupil yarata oladi": ["Администратор может создавать только учителей и учеников", "Only teachers and pupils can be created"],
  "Ism va familiya faqat lotin harflarida bo'lishi kerak": ["Имя и фамилия должны быть только латиницей", "First and last name must use Latin letters only"],
  "Nomi bo'sh bo'lmasligi kerak": ["Название не должно быть пустым", "Name must not be empty"],
  "Til uz, ru yoki en bo'lishi kerak": ["Язык должен быть uz, ru или en", "Language must be uz, ru or en"],
  "Tema light yoki dark bo'lishi kerak": ["Тема должна быть light или dark", "Theme must be light or dark"],
  "O'qituvchini tayinlab bo'lmadi": ["Не удалось назначить учителя", "Could not assign the teacher"],
};

// f-string bilan yasalgan matnlar uchun andozalar
const PATTERNS = [
  [/^'\.(.+)' turidagi fayl yuklash mumkin emas$/, (m) => [`Файлы типа .${m[1]} загружать нельзя`, `Files of type .${m[1]} cannot be uploaded`]],
  [/^Fayl hajmi (\d+) MB dan oshmasligi kerak$/, (m) => [`Размер файла не должен превышать ${m[1]} МБ`, `File size must not exceed ${m[1]} MB`]],
  [/^Dars davomiyligi (\d+)-(\d+) daqiqa orasida bo'lishi kerak$/, (m) => [`Длительность урока должна быть от ${m[1]} до ${m[2]} минут`, `Lesson length must be between ${m[1]} and ${m[2]} minutes`]],
];

const INDEX = { ru: 0, en: 1 };

export function translateDetail(detail, lang) {
  if (typeof detail !== "string") return null;
  const text = detail.replace(/^Value error, /, "").trim();
  if (lang === "uz") return text;
  const idx = INDEX[lang];
  if (ERRORS[text]) return ERRORS[text][idx];
  for (const [re, make] of PATTERNS) {
    const m = text.match(re);
    if (m) return make(m)[idx];
  }
  return text;
}
