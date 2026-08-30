def mock_send_email(to: str, subject: str, link: str):
    """
    Simulates sending an email by printing it to standard output.
    Industry standard pattern is keeping communication logic decoupled.
    """
    print(f"\n=== MOCK EMAIL ===")
    print(f"To: {to}")
    print(f"Subject: {subject}")
    print(f"Link: {link}")
    print(f"==================\n")
