import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/star_rating.dart';

class ReviewScreen extends ConsumerStatefulWidget {
  final int bookingId;
  const ReviewScreen({super.key, required this.bookingId});

  @override
  ConsumerState<ReviewScreen> createState() => _ReviewScreenState();
}

class _ReviewScreenState extends ConsumerState<ReviewScreen> {
  int _rating = 0;
  final _textController = TextEditingController();
  final _picker = ImagePicker();
  final List<XFile> _photos = [];
  bool _isSubmitting = false;
  String? _error;

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto() async {
    if (_photos.length >= 5) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Максимум 5 фото')),
      );
      return;
    }
    final result = await _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 80,
    );
    if (result != null) {
      setState(() => _photos.add(result));
    }
  }

  Future<void> _submit() async {
    if (_rating == 0) {
      setState(() => _error = 'Поставьте оценку');
      return;
    }
    setState(() {
      _isSubmitting = true;
      _error = null;
    });

    try {
      final client = ref.read(apiClientProvider);
      final formData = FormData.fromMap({
        'booking_id': widget.bookingId,
        'rating': _rating,
        'text': _textController.text.trim(),
        for (int i = 0; i < _photos.length; i++)
          'photos[$i]': await MultipartFile.fromFile(
            _photos[i].path,
            filename: _photos[i].name,
          ),
      });

      await client.dio.post(
        ApiEndpoints.reviews,
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Отзыв успешно отправлен!'),
            backgroundColor: successColor,
          ),
        );
        context.pop();
      }
    } on DioException catch (e) {
      setState(() {
        _error = e.userMessage;
        _isSubmitting = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Ошибка при отправке отзыва';
        _isSubmitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Оставить отзыв'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Rating
            const Text(
              AppStrings.yourRating,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: textPrimary,
              ),
            ),
            const SizedBox(height: 16),
            InteractiveStarRating(
              initialRating: _rating,
              onRatingChanged: (r) => setState(() {
                _rating = r;
                _error = null;
              }),
              size: 44,
            ),
            const SizedBox(height: 8),
            Text(
              _ratingLabel(_rating),
              style: const TextStyle(
                fontSize: 14,
                color: textSecondary,
              ),
            ),
            const SizedBox(height: 28),
            // Review text
            Align(
              alignment: Alignment.centerLeft,
              child: const Text(
                AppStrings.yourReview,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: textPrimary,
                ),
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _textController,
              maxLines: 5,
              maxLength: 500,
              decoration: InputDecoration(
                hintText: AppStrings.reviewHint,
                hintStyle: const TextStyle(color: textHint, fontSize: 14),
                filled: true,
                fillColor: backgroundColor,
                contentPadding: const EdgeInsets.all(16),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: dividerColor),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: dividerColor),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: primaryColor, width: 2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            // Photo picker
            Align(
              alignment: Alignment.centerLeft,
              child: const Text(
                AppStrings.addPhoto,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: textPrimary,
                ),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              height: 90,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  // Add button
                  GestureDetector(
                    onTap: _pickPhoto,
                    child: Container(
                      width: 80,
                      height: 80,
                      margin: const EdgeInsets.only(right: 10),
                      decoration: BoxDecoration(
                        color: backgroundColor,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: primaryColor,
                          style: BorderStyle.solid,
                        ),
                      ),
                      child: const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.add_photo_alternate_outlined,
                              color: primaryColor, size: 28),
                          SizedBox(height: 2),
                          Text(
                            'Фото',
                            style: TextStyle(
                              fontSize: 10,
                              color: primaryColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  // Selected photos
                  ..._photos.map(
                    (photo) => Stack(
                      children: [
                        Container(
                          width: 80,
                          height: 80,
                          margin: const EdgeInsets.only(right: 10),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            image: DecorationImage(
                              image: FileImage(File(photo.path)),
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                        Positioned(
                          top: 4,
                          right: 14,
                          child: GestureDetector(
                            onTap: () => setState(() => _photos.remove(photo)),
                            child: Container(
                              padding: const EdgeInsets.all(2),
                              decoration: const BoxDecoration(
                                color: Colors.black54,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.close,
                                size: 14,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 16),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: errorColor.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  _error!,
                  style: const TextStyle(color: errorColor, fontSize: 13),
                ),
              ),
            ],
            const SizedBox(height: 28),
            AppButton(
              label: AppStrings.submit,
              onPressed: _submit,
              isLoading: _isSubmitting,
            ),
          ],
        ),
      ),
    );
  }

  String _ratingLabel(int rating) {
    switch (rating) {
      case 1:
        return 'Ужасно 😞';
      case 2:
        return 'Плохо 😕';
      case 3:
        return 'Нормально 😐';
      case 4:
        return 'Хорошо 😊';
      case 5:
        return 'Отлично! 🌟';
      default:
        return 'Нажмите, чтобы оценить';
    }
  }
}
