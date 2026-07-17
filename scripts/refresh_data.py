"""Command entry point reserved for QuantDash refresh and cache generation."""

from backend.config import get_settings


if __name__ == "__main__":
    settings = get_settings()
    print(f"data_mode={settings.data_mode}; cache={settings.data_cache_dir}")
    print("Mock 模式无需刷新；QuantDash 接口由数据负责人接入。")

