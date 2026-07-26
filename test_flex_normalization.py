import unittest

from api_routes import normalize_flex_content


class NormalizeFlexContentTests(unittest.TestCase):
    def setUp(self):
        self.bubble = {
            'type': 'bubble',
            'hero': {
                'type': 'image',
                'url': 'https://example.com/image.png',
                'size': 'full',
                'aspectRatio': '10:9',
                'aspectMode': 'cover',
            },
        }

    def test_accepts_bubble(self):
        self.assertEqual(normalize_flex_content(self.bubble), self.bubble)

    def test_wraps_plugin_bubble_array_as_carousel(self):
        result = normalize_flex_content([self.bubble, self.bubble])
        self.assertEqual(result['type'], 'carousel')
        self.assertEqual(result['contents'], [self.bubble, self.bubble])

    def test_accepts_carousel(self):
        carousel = {'type': 'carousel', 'contents': [self.bubble]}
        self.assertEqual(normalize_flex_content(carousel), carousel)

    def test_unwraps_full_flex_message(self):
        contents = {'type': 'carousel', 'contents': [self.bubble]}
        message = {'type': 'flex', 'altText': '活動訊息', 'contents': contents}
        self.assertEqual(normalize_flex_content(message), contents)

    def test_rejects_non_bubble_carousel_items(self):
        with self.assertRaisesRegex(ValueError, '只能包含 bubble'):
            normalize_flex_content({
                'type': 'carousel',
                'contents': [{'type': 'text', 'text': 'invalid'}],
            })


if __name__ == '__main__':
    unittest.main()
