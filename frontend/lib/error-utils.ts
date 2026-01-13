export const fieldNames: Record<string, string> = {
    name: "Nomi",
    amount: "Summa",
    description: "Tavsif",
    building: "Bino",
    category: "Kategoriya",
    username: "Foydalanuvchi nomi",
    password: "Parol",
    password_confirm: "Parolni tasdiqlash",
    email: "Email",
    first_name: "Ism",
    last_name: "Familiya",
    role: "Rol",
    budget: "Byudjet",
    start_date: "Boshlanish sanasi",
    end_date: "Tugash sanasi",
    status: "Holati",
    date: "Sana",
    detail: "Xatolik",
}

export const errorMessages: Record<string, string> = {
    "This field may not be blank.": "Majburiy maydon, to'ldiring.",
    "Enter a valid number.": "To'g'ri raqam kiriting.",
    "A valid number is required.": "Raqam bo'lishi shart.",
    "Date has wrong format. Use one of these formats instead: YYYY-MM-DD.": "Sana formati noto'g'ri (YYYY-MM-DD).",
    "A user with that username already exists.": "Bunday foydalanuvchi allaqachon mavjud.",
    "Ensure this field has no more than": "Belgilar soni juda ko'p.",
    "Invalid email address.": "Email noto'g'ri kiritildi.",
    "Not found.": "Ma'lumot topilmadi.",
    "Object with this name already exists.": "Bunday nomli ma'lumot mavjud.",
}

export const getErrorMessage = (error: any): string => {
    if (!error) return "Noma'lum xatolik yuz berdi"

    if (typeof error === 'string') return error

    // DRF detail error (masalan 404, 403)
    if (error.detail) {
        return typeof error.detail === 'string'
            ? (errorMessages[error.detail] || error.detail)
            : "Xatolik yuz berdi"
    }

    // Field errors
    // error obyekti: { field1: ["err1"], field2: ["err2"] }
    const errorList: string[] = []

    Object.entries(error).forEach(([key, messages]) => {
        // Agar messagelar array bo'lmasa, arrayga o'tkazamiz
        const msgList = Array.isArray(messages) ? messages : [messages]

        msgList.forEach((msg: any) => {
            // Xabar string bo'lsa tarjima qilamiz
            let translatedMsg = typeof msg === 'string' ? msg : JSON.stringify(msg)

            // Known messages check (contains logic for flexible match if needed, but direct map is faster)
            // Oddiy map tekshiruvi
            if (errorMessages[translatedMsg]) {
                translatedMsg = errorMessages[translatedMsg]
            } else {
                // Partial match check (e.g. "Ensure this field has no more than 50 characters.")
                for (const [eng, uz] of Object.entries(errorMessages)) {
                    if (translatedMsg.includes(eng)) {
                        translatedMsg = uz
                        break
                    }
                }
            }

            const fieldName = fieldNames[key] || key
            // Agar 'non_field_errors' bo'lsa field name shart emas
            if (key === 'non_field_errors') {
                errorList.push(translatedMsg)
            } else {
                errorList.push(`${fieldName}: ${translatedMsg}`)
            }
        })
    })

    return errorList.join('\n') || "Xatolik yuz berdi"
}
