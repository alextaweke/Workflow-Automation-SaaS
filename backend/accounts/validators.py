from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _
import re

class UppercaseValidator:
    """Validate that the password contains at least one uppercase letter."""
    
    def validate(self, password, user=None):
        if not re.findall('[A-Z]', password):
            raise ValidationError(
                _("The password must contain at least 1 uppercase letter."),
                code='password_no_upper',
            )
    
    def get_help_text(self):
        return _("Your password must contain at least 1 uppercase letter.")

class SpecialCharValidator:
    """Validate that the password contains at least one special character."""
    
    def validate(self, password, user=None):
        if not re.findall('[!@#$%^&*(),.?":{}|<>]', password):
            raise ValidationError(
                _("The password must contain at least 1 special character: !@#$%^&*()"),
                code='password_no_special',
            )
    
    def get_help_text(self):
        return _("Your password must contain at least 1 special character: !@#$%^&*()")