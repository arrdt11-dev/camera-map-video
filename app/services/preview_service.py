import os
import subprocess
import tempfile


class PreviewService:
    @staticmethod
    def extract_first_frame(video_bytes: bytes) -> bytes:
        with tempfile.TemporaryDirectory() as temp_dir:
            input_path = os.path.join(temp_dir, "input.mp4")
            output_path = os.path.join(temp_dir, "preview.jpg")

            with open(input_path, "wb") as f:
                f.write(video_bytes)

            command = [
                "ffmpeg",
                "-y",
                "-i",
                input_path,
                "-frames:v",
                "1",
                "-q:v",
                "2",
                output_path,
            ]

            result = subprocess.run(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )

            if result.returncode != 0:
                raise ValueError("Failed to extract preview frame")

            if not os.path.exists(output_path):
                raise ValueError("Preview file was not created")

            with open(output_path, "rb") as f:
                return f.read()