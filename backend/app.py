from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse
import json


# =========================================================
# НАСТРОЙКИ
# =========================================================

HOST = "localhost"
PORT = 8000

BASE_DIR = Path(__file__).resolve().parent

FRONTEND_DIR = BASE_DIR.parent / "frontend"

# =========================================================
# ЛОКАЛЬНАЯ ЛОГИКА "ИИ"
#
# Никаких сторонних библиотек здесь нет.
# Это демонстрационная rule-based логика.
# =========================================================


def detect_category(message):
    """
    Определяем примерную категорию проблемы
    по словам в сообщении пользователя.
    """

    text = message.lower()

    if any(
        word in text
        for word in [
            "пароль",
            "войти",
            "вход",
            "авторизац",
            "логин",
            "аккаунт",
        ]
    ):
        return "auth"

    if any(
        word in text
        for word in [
            "wi-fi",
            "wifi",
            "вайфай",
            "интернет",
            "сеть",
        ]
    ):
        return "network"

    if any(
        word in text
        for word in [
            "vpn",
            "впн",
        ]
    ):
        return "vpn"

    if any(
        word in text
        for word in [
            "почта",
            "письмо",
            "outlook",
            "email",
            "e-mail",
        ]
    ):
        return "mail"

    if any(
        word in text
        for word in [
            "принтер",
            "печать",
            "распечат",
        ]
    ):
        return "printer"

    return "other"

def get_questions(message):
    message_lower = message.lower()

    if (
        "парол" in message_lower
        or "войти" in message_lower
        or "вход" in message_lower
        or "аккаунт" in message_lower
    ):
        return [
            {
                "title": "На каком устройстве у вас возникает проблема со входом?",
                "placeholder": "Например: рабочий ноутбук"
            },
            {
                "title": "Когда впервые появилась проблема?",
                "placeholder": "Например: сегодня после смены пароля"
            },
            {
                "title": "Какое сообщение появляется при попытке входа?",
                "placeholder": "Например: «Неверный пароль»"
            }
        ]

    return [
        {
            "title": "Что именно произошло и какое сообщение об ошибке вы видите?",
            "placeholder": "Опишите проблему подробнее..."
        },
        {
            "title": "Когда появилась эта проблема?",
            "placeholder": "Например: сегодня утром..."
        },
        {
            "title": "Что вы уже пробовали сделать самостоятельно?",
            "placeholder": "Например: перезапустил приложение..."
        }
    ]

    """
    Возвращаем 3 уточняющих вопроса.
    """

    category = detect_category(message)

    if category == "auth":
        return [
            {
                "title": "На каком устройстве возникает проблема со входом?",
                "placeholder": "Например: рабочий ноутбук..."
            },
            {
                "title": "Когда проблема появилась впервые?",
                "placeholder": "Например: после смены пароля сегодня утром..."
            },
            {
                "title": "Какое сообщение появляется при входе?",
                "placeholder": "Например: «Неверный пароль»..."
            },
        ]

    if category == "network":
        return [
            {
                "title": "На каком устройстве отсутствует подключение?",
                "placeholder": "Например: рабочий ноутбук..."
            },
            {
                "title": "Другие сайты или сервисы открываются?",
                "placeholder": "Например: интернет полностью отсутствует..."
            },
            {
                "title": "Что показывает значок подключения к сети?",
                "placeholder": "Например: «Без доступа к интернету»..."
            },
        ]

    if category == "vpn":
        return [
            {
                "title": "На каком устройстве вы подключаетесь к VPN?",
                "placeholder": "Например: рабочий ноутбук Windows..."
            },
            {
                "title": "Подключение к обычному интернету работает?",
                "placeholder": "Например: сайты открываются, но VPN не подключается..."
            },
            {
                "title": "Какое сообщение об ошибке показывает VPN?",
                "placeholder": "Напишите текст ошибки..."
            },
        ]

    if category == "mail":
        return [
            {
                "title": "Где возникает проблема с почтой?",
                "placeholder": "Например: Outlook на рабочем ноутбуке..."
            },
            {
                "title": "Письма не отправляются, не приходят или не открываются?",
                "placeholder": "Опишите, что именно не работает..."
            },
            {
                "title": "Появляется ли сообщение об ошибке?",
                "placeholder": "Напишите текст ошибки, если он есть..."
            },
        ]

    if category == "printer":
        return [
            {
                "title": "Какой принтер вы используете?",
                "placeholder": "Например: офисный принтер на 3 этаже..."
            },
            {
                "title": "Принтер виден в списке устройств?",
                "placeholder": "Например: виден, но документ не печатается..."
            },
            {
                "title": "Что происходит после отправки документа на печать?",
                "placeholder": "Например: документ остаётся в очереди..."
            },
        ]

    return [
        {
            "title": "На каком устройстве или в какой программе возникает проблема?",
            "placeholder": "Например: рабочий ноутбук, браузер, приложение..."
        },
        {
            "title": "Когда проблема появилась впервые?",
            "placeholder": "Например: сегодня утром..."
        },
        {
            "title": "Что именно происходит и есть ли сообщение об ошибке?",
            "placeholder": "Опишите результат или текст ошибки..."
        },
    ]


def make_summary(message, answers):
    """
    Формируем аккуратное описание проблемы
    из исходного сообщения и ответов.
    """

    device = answers[0] if len(answers) > 0 else ""
    time_info = answers[1] if len(answers) > 1 else ""
    details = answers[2] if len(answers) > 2 else ""

    parts = [
        f"Исходная проблема: {message}"
    ]

    if device:
        parts.append(
            f"Устройство или окружение: {device}"
        )

    if time_info:
        parts.append(
            f"Дополнительная информация: {time_info}"
        )

    if details:
        parts.append(
            f"Проявление проблемы: {details}"
        )

    return "\n\n".join(parts)


def make_solution(message, answers):
    """
    Формируем решение в зависимости
    от категории проблемы.
    """

    category = detect_category(message)

    if category == "auth":
        return [
            {
                "title": "На каком устройстве у вас возникает проблема со входом?",
                "placeholder": "Например: рабочий ноутбук"
            },
            {
                "title": "Когда появилась проблема со входом?",
                "placeholder": "Например: сегодня после смены пароля"
            },
            {
                "title": "Какое сообщение появляется при попытке входа?",
                "placeholder": "Например: «Неверный пароль»"
            }
        ]
        

    if category == "network":
        return {
            "status": "RESOLVED",
            "solution": [
                "Проверьте, включён ли Wi-Fi или кабельное подключение.",
                "Отключитесь от сети и подключитесь к ней повторно.",
                "Перезапустите браузер и попробуйте открыть другой сайт.",
                "Если интернет отсутствует на всех сервисах, перезапустите сетевое подключение."
            ]
        }

    if category == "vpn":
        return {
            "status": "RESOLVED",
            "solution": [
                "Убедитесь, что обычное интернет-соединение работает.",
                "Полностью закройте VPN-клиент.",
                "Запустите VPN снова и повторно выполните авторизацию.",
                "Если ошибка остаётся, передайте её текст специалисту поддержки."
            ]
        }

    if category == "mail":
        return {
            "status": "RESOLVED",
            "solution": [
                "Проверьте подключение к интернету и корпоративной сети.",
                "Закройте и снова откройте почтовое приложение.",
                "Проверьте, не требуется ли повторная авторизация.",
                "Если проблема сохраняется, попробуйте открыть почту через браузер."
            ]
        }

    if category == "printer":
        return {
            "status": "RESOLVED",
            "solution": [
                "Убедитесь, что принтер включён и доступен.",
                "Проверьте, выбран ли правильный принтер.",
                "Очистите зависшие документы из очереди печати.",
                "Повторно отправьте документ на печать."
            ]
        }

    return {
        "status": "RESOLVED",
        "solution": [
            "Перезапустите программу, в которой возникла проблема.",
            "Проверьте подключение к интернету или корпоративной сети.",
            "Повторите действие и запишите точный текст ошибки, если она появится.",
            "Если проблема сохранится, передайте сформированный запрос специалисту поддержки."
        ]
    }


# =========================================================
# HTTP-СЕРВЕР
# =========================================================


class SberHelpHandler(SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        super().__init__(
            *args,
            directory=str(FRONTEND_DIR),
            **kwargs
        )

    # -----------------------------------------------------
    # ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    # -----------------------------------------------------

    def send_json(self, data, status=200):

        response = json.dumps(
            data,
            ensure_ascii=False
        ).encode("utf-8")

        self.send_response(status)

        self.send_header(
            "Content-Type",
            "application/json; charset=utf-8"
        )

        self.send_header(
            "Content-Length",
            str(len(response))
        )

        self.end_headers()

        self.wfile.write(response)

    def read_json(self):

        length = int(
            self.headers.get(
                "Content-Length",
                "0"
            )
        )

        raw = self.rfile.read(length)

        if not raw:
            return {}

        return json.loads(
            raw.decode("utf-8")
        )

    # -----------------------------------------------------
    # GET
    # -----------------------------------------------------

    def do_GET(self):

        path = urlparse(
            self.path
        ).path

        # Чтобы http://localhost:8000
        # автоматически открывал index.html

        if path == "/":
            self.path = "/index.html"

        super().do_GET()

    # -----------------------------------------------------
    # POST
    # -----------------------------------------------------

    def do_POST(self):

        path = urlparse(
            self.path
        ).path

        try:
            data = self.read_json()

        except (
            json.JSONDecodeError,
            UnicodeDecodeError,
            ValueError
        ):

            self.send_json(
                {
                    "success": False,
                    "error": "Некорректный JSON"
                },
                400
            )

            return

        # =================================================
        # 1. АНАЛИЗ ПЕРВОГО СООБЩЕНИЯ
        # =================================================

        if path == "/api/analyze":

            message = str(
                data.get(
                    "message",
                    ""
                )
            ).strip()

            if not message:

                self.send_json(
                    {
                        "success": False,
                        "error": "Введите описание проблемы"
                    },
                    400
                )

                return

            questions = get_questions(
                message
            )

            self.send_json(
                {
                    "success": True,
                    "questions": questions
                }
            )

            return

        # =================================================
        # 2. ФОРМИРОВАНИЕ ПРОБЛЕМЫ
        # =================================================

        if path == "/api/summary":

            message = str(
                data.get(
                    "message",
                    ""
                )
            ).strip()

            answers = data.get(
                "answers",
                []
            )

            if not isinstance(
                answers,
                list
            ):
                answers = []

            summary = make_summary(
                message,
                answers
            )

            self.send_json(
                {
                    "success": True,
                    "summary": summary
                }
            )

            return

        # =================================================
        # 3. ПОЛУЧЕНИЕ РЕШЕНИЯ
        # =================================================

        if path == "/api/solution":

            message = str(
                data.get(
                    "message",
                    ""
                )
            ).strip()

            answers = data.get(
                "answers",
                []
            )

            if not isinstance(
                answers,
                list
            ):
                answers = []

            result = make_solution(
                message,
                answers
            )

            self.send_json(
                {
                    "success": True,
                    **result
                }
            )

            return

        # =================================================
        # НЕИЗВЕСТНЫЙ API-МАРШРУТ
        # =================================================

        self.send_json(
            {
                "success": False,
                "error": "Маршрут не найден"
            },
            404
        )

    # Убираем лишние сообщения HTTP-сервера
    # при каждом запросе.

    def log_message(
        self,
        format,
        *args
    ):
        print(
            f"[SberHelp] {self.address_string()} - {format % args}"
        )


# =========================================================
# ЗАПУСК
# =========================================================


def main():

    if not FRONTEND_DIR.exists():

        print(
            "ОШИБКА: папка frontend не найдена."
        )

        print(
            f"Ожидалась папка: {FRONTEND_DIR}"
        )

        return

    server = ThreadingHTTPServer(
        (HOST, PORT),
        SberHelpHandler
    )

    print()
    print(
        "============================================"
    )
    print(
        "        SberHelp запущен"
    )
    print(
        "============================================"
    )
    print()
    print(
        f"Откройте в браузере: http://{HOST}:{PORT}"
    )
    print()
    print(
        "Для остановки сервера нажмите Ctrl + C"
    )
    print()

    try:

        server.serve_forever()

    except KeyboardInterrupt:

        print()
        print(
            "SberHelp остановлен."
        )

    finally:

        server.server_close()


if __name__ == "__main__":
    main()