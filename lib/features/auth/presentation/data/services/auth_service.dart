import 'dart:convert';
import 'package:http/http.dart' as http;

class AuthService {
  static const String baseUrl = "http://192.168.29.167:3000/api/auth";

  // ================= STEP 1: REGISTER (Send OTP) =================
  static Future<Map<String, dynamic>> register({
    required String firstName,
    required String lastName,
    required String email,
    required String mobile,
    required String password,
  }) async {
    try {
      // Build body — only send email if provided, only mobile if provided
      final Map<String, dynamic> body = {
        "first_name": firstName,
        "last_name": lastName,
        "password": password,
      };
      if (email.isNotEmpty)  body["email"]  = email;
      if (mobile.isNotEmpty) body["mobile"] = mobile;

      final response = await http.post(
        Uri.parse("$baseUrl/register"), // ✅ FIXED: was /send-otp
        headers: {"Content-Type": "application/json"},
        body: jsonEncode(body),
      ).timeout(const Duration(seconds: 15));

      return jsonDecode(response.body);
    } catch (e) {
      return {"message": "Connection failed: $e"};
    }
  }

  // ================= STEP 2: VERIFY OTP =================
  static Future<Map<String, dynamic>> verifyOTP({
    required String emailOrMobile,
    required String otp,
  }) async {
    try {
      final response = await http.post(
        Uri.parse("$baseUrl/verify-otp"), // ✅ correct
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "emailOrMobile": emailOrMobile, // ✅ FIXED: only send these 2 fields
          "otp": otp,
        }),
      ).timeout(const Duration(seconds: 10));

      return jsonDecode(response.body);
    } catch (e) {
      return {"message": "Connection failed: $e"};
    }
  }

  // ================= STEP 3: LOGIN =================
  static Future<Map<String, dynamic>> login(
      String emailOrMobile, String password) async {
    try {
      final response = await http.post(
        Uri.parse("$baseUrl/login"), // ✅ already correct
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "emailOrMobile": emailOrMobile,
          "password": password,
        }),
      ).timeout(const Duration(seconds: 10));

      return jsonDecode(response.body);
    } catch (e) {
      return {"message": "Connection failed: $e"};
    }
  }
}