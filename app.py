'''
git add requirements.txt
git commit -m "Add requirements.txt"
git push origin main
'''


from flask import Flask, request, jsonify, render_template
from supabase import create_client, Client

app = Flask(__name__)

SUPABASE_URL = "https://rvinvraaphbdcgoifjin.supabase.co"
SUPABASE_KEY = "sb_secret_Y-rj8tJewABB0aVc2m8sVg_GAHPesYj"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

room_data = {}
room_data_b = {}

@app.route('/')
def index():
    return render_template('index.html')


# ======================
# room_a
# ======================
@app.route('/load_data')
def load_data():
    global room_data
    res = supabase.table("room_a").select("*").execute()
    room_data = {item["reservation_term"]: item for item in res.data}
    return jsonify(list(room_data.values()))


@app.route('/update_local', methods=['POST'])
def update_local():
    global room_data
    data = request.get_json()
    term = data["reservation_term"]

    # upsert: 존재하면 update, 없으면 insert
    try:
        supabase.table("room_a").upsert([{
            "reservation_term": term,
            "people_number": data.get("people_number", ""),
            "tel": data.get("tel", ""),
            "name": data.get("name", "")
        }]).execute()
        # 로컬도 갱신
        room_data[term] = {
            "reservation_term": term,
            "people_number": data.get("people_number", ""),
            "tel": data.get("tel", ""),
            "name": data.get("name", "")
        }
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})


@app.route('/save_to_db', methods=['POST'])
def save_to_db():
    # 이미 upsert로 반영되므로 별도 처리 없음
    return jsonify({"success": True})


# ======================
# room_b
# ======================
@app.route('/load_data_b')
def load_data_b():
    global room_data_b
    res = supabase.table("room_b").select("*").execute()
    room_data_b = {item["reservation_term"]: item for item in res.data}
    return jsonify(list(room_data_b.values()))


@app.route('/update_local_b', methods=['POST'])
def update_local_b():
    global room_data_b
    data = request.get_json()
    term = data["reservation_term"]

    try:
        supabase.table("room_b").upsert([{
            "reservation_term": term,
            "people_number": data.get("people_number", ""),
            "tel": data.get("tel", ""),
            "name": data.get("name", "")
        }]).execute()
        room_data_b[term] = {
            "reservation_term": term,
            "people_number": data.get("people_number", ""),
            "tel": data.get("tel", ""),
            "name": data.get("name", "")
        }
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})


@app.route('/save_to_db_b', methods=['POST'])
def save_to_db_b():
    return jsonify({"success": True})


# ======================
# check_list
# ======================
@app.route('/load_check_list')
def load_check_list():
    try:
        res = supabase.table("check_list").select("*").execute()
        return jsonify(res.data)
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})


@app.route("/update_check_list", methods=["POST"])
def update_check_list():
    data = request.get_json()
    key = data["key"]
    value = data["value"]
    try:
        supabase.table("check_list").update({key: value}).eq("id", 1).execute()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})


# ======================
# 전체 초기화
# ======================
@app.route("/reset_all", methods=["POST"])
def reset_all():
    try:
        # room_a / room_b 전체 삭제
        supabase.table("room_a").delete().neq("reservation_term", None).execute()
        supabase.table("room_b").delete().neq("reservation_term", None).execute()

        # check_list 초기화 (1행 유지)
        columns = ["a_one_in","a_one_out","a_two_in","a_two_out","a_three_in","a_three_out",
                   "b_one_in","b_one_out","b_two_in","b_two_out","b_three_in","b_three_out"]

        # 이미 존재하는 id=1 행을 업데이트
        update_data = {col: False for col in columns}
        supabase.table("check_list").update(update_data).eq("id", 1).execute()

        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})



if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
